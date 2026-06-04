import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetEntry, 
  useCreateEntry, 
  useUpdateEntry,
  useListCategories,
  getGetEntryQueryKey,
  getListEntriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save, Settings2 } from "lucide-react";

const entrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  contactPhone: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  location: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  moreDetails: z.string().optional().nullable(),
  published: z.boolean().default(false)
});

type EntryFormValues = z.infer<typeof entrySchema>;

function prettifyKey(key: string): string {
  return key
    .replace(/^custom_/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function AdminEntryFormPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const entryId = isEditing ? parseInt(id, 10) : 0;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Custom fields are dynamic — managed outside react-hook-form
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const { data: categories } = useListCategories();
  
  const { data: entry, isLoading: isLoadingEntry } = useGetEntry(entryId, {
    query: { enabled: isEditing }
  });

  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: "",
      category: "",
      summary: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      location: "",
      tags: "",
      moreDetails: "",
      published: false
    }
  });

  useEffect(() => {
    if (entry && isEditing) {
      form.reset({
        title: entry.title,
        category: entry.category || "",
        summary: entry.summary || "",
        description: entry.description || "",
        contactEmail: entry.contactEmail || "",
        contactPhone: entry.contactPhone || "",
        website: entry.website || "",
        location: entry.location || "",
        tags: entry.tags || "",
        moreDetails: entry.moreDetails || "",
        published: entry.published
      });

      // Populate custom fields from JSONB
      if (entry.customFields && typeof entry.customFields === "object") {
        const cf: Record<string, string> = {};
        for (const [k, v] of Object.entries(entry.customFields as Record<string, unknown>)) {
          cf[k] = v == null ? "" : String(v);
        }
        setCustomFields(cf);
      }
    }
  }, [entry, isEditing, form]);

  const onSubmit = async (data: EntryFormValues) => {
    // Clean up empty strings to null for core fields
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
    ) as any;

    // Merge custom fields: keep keys, convert empty string → null
    const cleanCustomFields: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(customFields)) {
      cleanCustomFields[k] = v.trim() === "" ? null : v.trim();
    }
    cleanData.customFields = Object.keys(cleanCustomFields).length > 0 ? cleanCustomFields : null;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: entryId, data: cleanData });
        toast({ title: "Entry updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetEntryQueryKey(entryId) });
      } else {
        await createMutation.mutateAsync({ data: cleanData });
        toast({ title: "Entry created successfully" });
      }
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      setLocation("/admin/entries");
    } catch (e: any) {
      toast({ title: "Error saving entry", description: e.message, variant: "destructive" });
    }
  };

  if (isEditing && isLoadingEntry) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const customFieldKeys = Object.keys(customFields);

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Entry" : "New Entry"}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Core fields */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Business Name or Entry Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select key={field.value ?? "__empty__"} value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State or Address" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Summary (Short description)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief 1-2 sentence description" rows={2} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description of the entry..." rows={6} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Links */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <h3 className="text-lg font-semibold">Contact & Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma separated (e.g. tech, design, b2b)" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="moreDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any structured data extracted during import..." rows={4} className="font-mono text-sm" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Free text or JSON to display in the additional details section.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom fields — populated from CSV import */}
          {customFieldKeys.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Custom Fields</h3>
                  <Badge variant="secondary">{customFieldKeys.length} field{customFieldKeys.length !== 1 ? "s" : ""} from import</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customFieldKeys.map(key => {
                    const value = customFields[key] ?? "";
                    const isLong = value.length > 100;
                    return (
                      <div key={key} className={isLong ? "col-span-1 md:col-span-2" : ""}>
                        <label className="text-sm font-medium leading-none mb-2 block">
                          {prettifyKey(key)}
                          <span className="ml-2 text-xs text-muted-foreground font-normal font-mono">({key})</span>
                        </label>
                        {isLong ? (
                          <Textarea
                            rows={3}
                            value={value}
                            onChange={e => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            value={value}
                            onChange={e => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                            className="text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publish status */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish Status</FormLabel>
                      <FormDescription>
                        Make this entry visible on the public directory.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/entries")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Entry
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
