import { useEffect, useState } from "react";
import { Link } from "wouter";
import { 
  useGetSettings, 
  useUpdateSettings,
  getGetSettingsQueryKey,
  getGetPublicSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Layout, Home, Search, FileText, ArrowRight, Paintbrush, KeyRound, Pencil, Trash2, Check, X, Copy, Map } from "lucide-react";
import { TemplateEditor } from "@/components/template/TemplateEditor";
import { mergeTemplateSettings, type TemplateSettings } from "@/lib/templateTypes";

const settingsSchema = z.object({
  siteTitle: z.string().min(2, "Site title is required"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  homepageHeadline: z.string().optional().nullable(),
  homepageDescription: z.string().optional().nullable(),
  heroHeadlineColor: z.string().optional().nullable(),
  heroSubtitleColor: z.string().optional().nullable(),
  themeColor: z.string().optional().nullable(),
  navbarBgColor: z.string().optional().nullable(),
  navbarTextColor: z.string().optional().nullable(),
  heroSearchPlaceholder: z.string().optional().nullable(),
  heroSearchButtonText: z.string().optional().nullable(),
  heroSearchButtonColor: z.string().optional().nullable(),
  heroSearchButtonTextColor: z.string().optional().nullable(),
  faviconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  footerText: z.string().optional().nullable(),
  privacyPolicyUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  termsUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  headScripts: z.string().optional().nullable(),
  bodyScripts: z.string().optional().nullable(),
  calloutSections: z.string().optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const BUILDER_PAGES = [
  {
    key: "homepage",
    label: "Homepage",
    description: "Hero, category grid, featured & recent sections",
    icon: Home,
    color: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeColor: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300",
  },
  {
    key: "browse",
    label: "Browse / Categories",
    description: "Search filters, category sidebar & entry card grid",
    icon: Search,
    color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  },
  {
    key: "entry",
    label: "Entry Detail",
    description: "Title, description, details sidebar & related entries",
    icon: FileText,
    color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
  },
];

function GeminiApiKeyCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const keySet: boolean = (settings as any)?.geminiApiKeySet ?? false;
  const keyHint: string | null = (settings as any)?.geminiApiKeyHint ?? null;

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ data: { geminiApiKey: keyInput.trim() } as any });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Gemini API key saved" });
      setKeyInput("");
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Failed to save key", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    setDeleting(true);
    try {
      await updateMutation.mutateAsync({ data: { geminiApiKey: null } as any });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Gemini API key removed — using built-in key" });
    } catch (e: any) {
      toast({ title: "Failed to remove key", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Gemini API Key
        </CardTitle>
        <CardDescription>
          Optionally supply your own Google Gemini API key. When set it will be used for CSV import and SEO generation instead of the built-in key. The key is stored securely and never exposed to visitors or editors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {keySet && keyHint ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono bg-muted px-3 py-1.5 rounded-md border">
                    {keyHint}
                  </span>
                  <span className="text-xs text-muted-foreground">Custom key active</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not configured — using the built-in Replit integration key.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setKeyInput(""); setEditing(true); }}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              {keySet ? "Replace" : "Add Key"}
            </Button>
            {keySet && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteKey}
                disabled={deleting}
                className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste your Gemini API key here..."
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                className="font-mono text-sm flex-1"
                autoFocus
              />
              <Button
                onClick={handleSaveKey}
                disabled={saving || !keyInput.trim()}
                className="gap-1.5 shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditing(false); setKeyInput(""); }}
                className="gap-1.5 shrink-0"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The key is stored encrypted on the server and never sent back to your browser in full.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SitemapUrlField() {
  const [copied, setCopied] = useState(false);
  const sitemapUrl = `${window.location.origin}/sitemap.xml`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sitemapUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1.5">Your Sitemap URL</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 text-sm font-mono text-muted-foreground select-all overflow-x-auto">
            {sitemapUrl}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 space-y-1">
        <p className="font-medium">How to submit to Google Search Console</p>
        <ol className="list-decimal list-inside space-y-0.5 text-blue-700 dark:text-blue-400">
          <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline">search.google.com/search-console</a></li>
          <li>Select your property, then open <strong>Sitemaps</strong> in the left menu</li>
          <li>Paste the URL above into the "Add a new sitemap" field and click Submit</li>
        </ol>
      </div>
      <p className="text-xs text-muted-foreground">
        The sitemap automatically includes your homepage, browse page, and all published entries. It updates in real time as entries are published.
      </p>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>(
    mergeTemplateSettings(null)
  );

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteTitle: "",
      logoUrl: "",
      homepageHeadline: "",
      homepageDescription: "",
      heroHeadlineColor: "",
      heroSubtitleColor: "",
      themeColor: "",
      navbarBgColor: "",
      navbarTextColor: "",
      heroSearchPlaceholder: "",
      heroSearchButtonText: "",
      heroSearchButtonColor: "",
      heroSearchButtonTextColor: "",
      faviconUrl: "",
      footerText: "",
      privacyPolicyUrl: "",
      termsUrl: "",
      headScripts: "",
      bodyScripts: "",
      calloutSections: "",
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        siteTitle: settings.siteTitle,
        logoUrl: settings.logoUrl || "",
        homepageHeadline: settings.homepageHeadline || "",
        homepageDescription: settings.homepageDescription || "",
        heroHeadlineColor: (settings as any).heroHeadlineColor || "",
        heroSubtitleColor: (settings as any).heroSubtitleColor || "",
        themeColor: settings.themeColor || "",
        navbarBgColor: (settings as any).navbarBgColor || "",
        navbarTextColor: (settings as any).navbarTextColor || "",
        heroSearchPlaceholder: (settings as any).heroSearchPlaceholder || "",
        heroSearchButtonText: (settings as any).heroSearchButtonText || "",
        heroSearchButtonColor: (settings as any).heroSearchButtonColor || "",
        heroSearchButtonTextColor: (settings as any).heroSearchButtonTextColor || "",
        faviconUrl: (settings as any).faviconUrl || "",
        footerText: (settings as any).footerText || "",
        privacyPolicyUrl: (settings as any).privacyPolicyUrl || "",
        termsUrl: (settings as any).termsUrl || "",
        headScripts: (settings as any).headScripts || "",
        bodyScripts: (settings as any).bodyScripts || "",
        calloutSections: settings.calloutSections || "",
      });
      setTemplateSettings(mergeTemplateSettings((settings as any).templateSettings));
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
    ) as any;

    try {
      await updateMutation.mutateAsync({ data: { ...cleanData, templateSettings } });
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPublicSettingsQueryKey() });
    } catch (e: any) {
      toast({ title: "Error saving settings", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-gray-500 mt-1">Manage your directory's identity and appearance.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Brand Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>Global settings applied across your directory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="siteTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Directory Master" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Displayed in the browser tab and header.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Absolute URL to your site's logo image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="themeColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Theme Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer border-0 shadow-none"
                        {...field}
                        value={field.value || '#3b82f6'}
                      />
                      <FormControl>
                        <Input className="w-32 font-mono" placeholder="#3b82f6" {...field} value={field.value || ''} />
                      </FormControl>
                    </div>
                    <FormDescription>Hex color code used for buttons and highlights.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-4">Navigation Bar Colors</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="navbarBgColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Color</FormLabel>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 cursor-pointer border-0 shadow-none"
                            value={field.value || '#ffffff'}
                            onChange={field.onChange}
                          />
                          <FormControl>
                            <Input
                              className="w-36 font-mono"
                              placeholder="#ffffff"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          {field.value && (
                            <button
                              type="button"
                              onClick={() => field.onChange("")}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <FormDescription>Top bar background. Leave blank for the default white.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="navbarTextColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text &amp; Icon Color</FormLabel>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 cursor-pointer border-0 shadow-none"
                            value={field.value || '#111827'}
                            onChange={field.onChange}
                          />
                          <FormControl>
                            <Input
                              className="w-36 font-mono"
                              placeholder="#111827"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          {field.value && (
                            <button
                              type="button"
                              onClick={() => field.onChange("")}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <FormDescription>Site title, nav links, and search icon color. Useful for white logos on dark headers.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Live preview strip */}
                {(form.watch("navbarBgColor") || form.watch("navbarTextColor")) && (
                  <div
                    className="mt-4 rounded-lg border px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: form.watch("navbarBgColor") || undefined,
                      color: form.watch("navbarTextColor") || undefined,
                      borderColor: form.watch("navbarBgColor") ? "transparent" : undefined,
                    }}
                  >
                    <span className="font-bold text-base">{form.watch("siteTitle") || "Your Site"}</span>
                    <span className="mx-auto" />
                    <span className="opacity-70">Browse All</span>
                    <span className="opacity-70">Sign In</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Homepage Content */}
          <Card>
            <CardHeader>
              <CardTitle>Homepage Content</CardTitle>
              <CardDescription>Customize the hero section text of your directory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="homepageHeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Headline</FormLabel>
                    <FormControl>
                      <Input placeholder="Discover the best resources in tech" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroHeadlineColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer border-0 shadow-none"
                        value={field.value || '#ffffff'}
                        onChange={field.onChange}
                      />
                      <FormControl>
                        <Input className="w-36 font-mono" placeholder="#ffffff" {...field} value={field.value || ''} />
                      </FormControl>
                      {field.value && (
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline" onClick={() => field.onChange("")}>
                          Reset
                        </button>
                      )}
                    </div>
                    <FormDescription>Leave blank to use the default (white on images, dark on solid).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="homepageDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Subtitle</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A curated collection of tools..." rows={3} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroSubtitleColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer border-0 shadow-none"
                        value={field.value || '#e2e8f0'}
                        onChange={field.onChange}
                      />
                      <FormControl>
                        <Input className="w-36 font-mono" placeholder="#e2e8f0" {...field} value={field.value || ''} />
                      </FormControl>
                      {field.value && (
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline" onClick={() => field.onChange("")}>
                          Reset
                        </button>
                      )}
                    </div>
                    <FormDescription>Leave blank to use the default (light on images, dark on solid).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Hero Search Bar</p>
                <p className="text-sm text-muted-foreground mb-4">A prominent search field displayed in the centre of the hero banner.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="heroSearchPlaceholder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Placeholder Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Search directory..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Hint text shown inside the search box.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heroSearchButtonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Button Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Search" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Label on the button next to the search field.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                  <FormField
                    control={form.control}
                    name="heroSearchButtonColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Button Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              className="w-10 h-9 rounded border cursor-pointer p-0.5"
                              value={field.value || "#3b82f6"}
                              onChange={e => field.onChange(e.target.value)}
                            />
                            <Input
                              className="font-mono text-sm"
                              placeholder="#3b82f6"
                              {...field}
                              value={field.value || ""}
                            />
                            {field.value && (
                              <button type="button" className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap" onClick={() => field.onChange("")}>
                                Reset
                              </button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Leave blank to use the theme color.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heroSearchButtonTextColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Button Text Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              className="w-10 h-9 rounded border cursor-pointer p-0.5"
                              value={field.value || "#ffffff"}
                              onChange={e => field.onChange(e.target.value)}
                            />
                            <Input
                              className="font-mono text-sm"
                              placeholder="#ffffff"
                              {...field}
                              value={field.value || ""}
                            />
                            {field.value && (
                              <button type="button" className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap" onClick={() => field.onChange("")}>
                                Reset
                              </button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Leave blank to use white.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Page Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5 text-primary" />
                    Visual Page Builder
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Open the drag-and-drop builder to visually design each page — rearrange sections, 
                    add custom text and image blocks, and configure per-section styles.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BUILDER_PAGES.map(page => {
                  const Icon = page.icon;
                  return (
                    <Link key={page.key} href={`/admin/builder/${page.key}`}>
                      <div className={`group border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${page.color}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-white/50 dark:border-gray-700`}>
                            <Icon className={`h-5 w-5 ${page.iconColor}`} />
                          </div>
                          <ArrowRight className={`h-4 w-4 ${page.iconColor} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
                        </div>
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">{page.label}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{page.description}</p>
                        <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${page.badgeColor}`}>
                          <Paintbrush className="h-3 w-3" />
                          Open Builder
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Page Templates (fine-grained controls) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Page Templates
              </CardTitle>
              <CardDescription>
                Fine-grained controls: fonts, banner images, section visibility and order, and field display for each page. 
                Changes here are saved along with all other settings when you click Save below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateEditor value={templateSettings} onChange={setTemplateSettings} />
            </CardContent>
          </Card>

          {/* Favicon */}
          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>The small icon shown in browser tabs and bookmarks for every page on your site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="faviconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL</FormLabel>
                    <div className="flex items-center gap-3">
                      {field.value && (
                        <img
                          src={field.value}
                          alt="Favicon preview"
                          className="h-8 w-8 rounded object-contain border bg-muted/30"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://yoursite.com/favicon.ico"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Direct URL to a <code className="text-xs bg-muted px-1 rounded">.ico</code>, <code className="text-xs bg-muted px-1 rounded">.png</code>, or <code className="text-xs bg-muted px-1 rounded">.svg</code> file. Recommended size: 32×32 px or 64×64 px. Changes take effect immediately after saving.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sitemap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-muted-foreground" />
                XML Sitemap
              </CardTitle>
              <CardDescription>
                Submit your sitemap URL to Google Search Console to help search engines discover all your pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SitemapUrlField />
            </CardContent>
          </Card>

          {/* Footer */}
          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>Customize the bottom bar shown on every public page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text</FormLabel>
                    <FormControl>
                      <Input placeholder="© 2024 Your Company. All rights reserved." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Overrides the default copyright line. Leave blank to use the site title automatically.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="privacyPolicyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Privacy Policy URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/privacy" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Shown as a link in the footer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="termsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms &amp; Conditions URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/terms" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Shown as a link in the footer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Code & Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Code &amp; Tracking</CardTitle>
              <CardDescription>
                Inject scripts and styles into every public page — ideal for Google Tag Manager, Meta Pixel, Google Analytics, or any other tracking snippet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="headScripts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Scripts / CSS</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        className="font-mono text-xs"
                        placeholder={`<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXX');</script>\n\n<!-- or any <style> block -->`}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Injected inside <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code> on every public page. Paste full <code className="text-xs bg-muted px-1 rounded">&lt;script&gt;</code> or <code className="text-xs bg-muted px-1 rounded">&lt;style&gt;</code> tags.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bodyScripts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body / Footer Scripts</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        className="font-mono text-xs"
                        placeholder={`<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Injected at the end of <code className="text-xs bg-muted px-1 rounded">&lt;body&gt;</code> on every public page. Use for GTM noscript fallbacks, chat widgets, or other footer scripts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Advanced */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced</CardTitle>
              <CardDescription>Additional configuration for your directory.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="calloutSections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Callout Sections (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='[{"title": "Submit a listing", "url": "/submit"}]' 
                        rows={5} 
                        className="font-mono text-sm"
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormDescription>Valid JSON array to render custom blocks on the homepage.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} size="lg">
              {updateMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>

      <GeminiApiKeyCard />
    </div>
  );
}
