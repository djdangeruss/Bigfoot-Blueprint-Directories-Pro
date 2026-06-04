import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  useListEntries, 
  getListEntriesQueryKey,
  useListCategories,
  getListCategoriesQueryKey,
  useToggleEntryPublished,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Files, 
  Tags, 
  Eye, 
  EyeOff, 
  Plus, 
  Upload, 
  Settings,
  MoreVertical,
  Edit
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const togglePublishMutation = useToggleEntryPublished();
  
  // Quick fetch of entries just to get totals (page 1, limit 1 is fine, but we'll fetch 10 for recent table)
  const { data: entriesData, isLoading: entriesLoading } = useListEntries({ limit: 10, page: 1 });
  const { data: categoriesData, isLoading: categoriesLoading } = useListCategories();

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await togglePublishMutation.mutateAsync({ id, data: { published: !currentStatus } });
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    } catch (e) {
      // toast is handled inside the component or we can add one here
    }
  };

  const totalEntries = entriesData?.total || 0;
  const totalCategories = categoriesData?.length || 0;
  const publishedCount = entriesData?.entries.filter(e => e.published).length || 0; // rough estimate based on recent, ideally from API stats
  const draftCount = totalEntries - publishedCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-2">Overview of your directory data and quick actions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active directory listings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Used for organizing entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Published and drafts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/entries/new" className="block">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Plus className="h-6 w-6" />
            <span>Add Entry</span>
          </Button>
        </Link>
        <Link href="/admin/import" className="block">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Upload className="h-6 w-6" />
            <span>Import CSV</span>
          </Button>
        </Link>
        <Link href="/admin/categories" className="block">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Tags className="h-6 w-6" />
            <span>Manage Categories</span>
          </Button>
        </Link>
        <Link href="/admin/settings" className="block">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
            <Settings className="h-6 w-6" />
            <span>Site Settings</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Entries</CardTitle>
          </div>
          <Link href="/admin/entries">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Added</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {entriesLoading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center">Loading...</td>
                  </tr>
                ) : entriesData?.entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-muted-foreground">No entries found.</td>
                  </tr>
                ) : (
                  entriesData?.entries.map((entry) => (
                    <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">{entry.title}</td>
                      <td className="p-4 align-middle">
                        {entry.category ? (
                          <Badge variant="secondary">{entry.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {format(new Date(entry.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={entry.published} 
                            onCheckedChange={() => handleTogglePublish(entry.id, entry.published)}
                            disabled={togglePublishMutation.isPending}
                          />
                          <span className="text-xs font-medium text-muted-foreground">
                            {entry.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link href={`/admin/entries/${entry.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
