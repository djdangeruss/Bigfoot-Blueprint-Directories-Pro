import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import {
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  FileText,
  Tag,
  RefreshCw,
  Save,
  Home,
  Image,
} from "lucide-react";

interface SeoSummary {
  total: number;
  withSeo: number;
  missingSeo: number;
}

interface SeoJobStatus {
  jobId: string;
  status: "running" | "complete" | "error";
  total: number;
  processed: number;
  progress: number;
  message: string;
  error?: string;
}

export default function AdminSeoPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<SeoSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [job, setJob] = useState<SeoJobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Homepage meta state
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [metaSaving, setMetaSaving] = useState(false);

  const authHeaders = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const { data: settings, isLoading: settingsLoading } = useGetSettings({
    request: { headers: authHeaders },
  });

  const updateSettings = useUpdateSettings();

  // Populate fields once settings load
  useEffect(() => {
    if (settings) {
      setMetaTitle(settings.homepageMetaTitle ?? "");
      setMetaDescription(settings.homepageMetaDescription ?? "");
      setOgImageUrl(settings.homepageOgImageUrl ?? "");
    }
  }, [settings]);

  const handleSaveMeta = async () => {
    setMetaSaving(true);
    try {
      await updateSettings.mutateAsync({
        data: {
          homepageMetaTitle: metaTitle || null,
          homepageMetaDescription: metaDescription || null,
          homepageOgImageUrl: ogImageUrl || null,
        },
      });
      toast({ title: "Homepage SEO saved", description: "Meta tags updated successfully." });
    } catch {
      toast({ title: "Save failed", description: "Could not update homepage SEO.", variant: "destructive" });
    } finally {
      setMetaSaving(false);
    }
  };

  const metaDirty =
    metaTitle !== (settings?.homepageMetaTitle ?? "") ||
    metaDescription !== (settings?.homepageMetaDescription ?? "") ||
    ogImageUrl !== (settings?.homepageOgImageUrl ?? "");

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/seo/summary", { headers: authHeaders });
      if (res.ok) setSummary(await res.json());
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const pollJob = (jobId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/seo/status/${jobId}`, { headers: authHeaders });
        if (!res.ok) return;
        const data: SeoJobStatus = await res.json();
        setJob(data);
        if (data.status === "complete" || data.status === "error") {
          stopPolling();
          if (data.status === "complete") {
            toast({ title: "SEO generation complete", description: data.message });
            loadSummary();
          } else {
            toast({ title: "SEO generation failed", description: data.error, variant: "destructive" });
          }
        }
      } catch {}
    }, 1500);
  };

  const handleBulkGenerate = async () => {
    try {
      const res = await fetch("/api/seo/bulk", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ overwrite }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Failed to start SEO job", description: err.error, variant: "destructive" });
        return;
      }
      const data: SeoJobStatus = await res.json();
      setJob(data);
      pollJob(data.jobId);
    } catch {
      toast({ title: "Error", description: "Could not start SEO generation", variant: "destructive" });
    }
  };

  const isRunning = job?.status === "running";
  const coverage = summary ? Math.round((summary.withSeo / Math.max(summary.total, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            SEO Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Use Gemini AI to bulk-generate slugs, meta titles, meta descriptions, and Open Graph tags for every entry.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSummary} disabled={summaryLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${summaryLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Homepage SEO ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Homepage Meta Tags
          </CardTitle>
          <CardDescription>
            Manually set the meta title, meta description, and Open Graph image shown when someone shares your homepage link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="meta-title" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Meta Title
                </Label>
                <Input
                  id="meta-title"
                  placeholder="e.g. Bigfoot Blueprint — Find Local Services"
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Shown in browser tabs and search results. Aim for 50–60 characters.{" "}
                  <span className={metaTitle.length > 60 ? "text-amber-500 font-medium" : ""}>
                    {metaTitle.length}/60
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meta-desc" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Meta Description
                </Label>
                <Textarea
                  id="meta-desc"
                  placeholder="e.g. Browse hundreds of local businesses, events, and services in one place."
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground">
                  Shown under your link in Google and social previews. Aim for 140–160 characters.{" "}
                  <span className={metaDescription.length > 160 ? "text-amber-500 font-medium" : ""}>
                    {metaDescription.length}/160
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="og-image" className="flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  Open Graph Image URL
                </Label>
                <Input
                  id="og-image"
                  type="url"
                  placeholder="https://yoursite.com/og-image.jpg"
                  value={ogImageUrl}
                  onChange={e => setOgImageUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The preview image shown when your homepage is shared on social media. Recommended: 1200×630 px.
                </p>
              </div>

              {ogImageUrl && (
                <div className="rounded-lg overflow-hidden border bg-muted/30 p-2">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Image preview</p>
                  <img
                    src={ogImageUrl}
                    alt="OG image preview"
                    className="h-32 w-full object-cover rounded"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={handleSaveMeta}
                  disabled={metaSaving || !metaDirty}
                  size="sm"
                  className="gap-2"
                >
                  {metaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {metaSaving ? "Saving…" : "Save Homepage SEO"}
                </Button>
                {!metaDirty && !metaSaving && settings && (
                  <span className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Coverage card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">SEO Coverage</CardTitle>
          <CardDescription>How many entries currently have SEO metadata</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{summary.withSeo}</span>
                <span className="text-muted-foreground text-sm">of {summary.total} entries</span>
              </div>
              <Progress value={coverage} className="h-2" />
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {summary.withSeo} with SEO
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  {summary.missingSeo} missing SEO
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Could not load stats.</p>
          )}
        </CardContent>
      </Card>

      {/* What gets generated */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What Gets Generated</CardTitle>
          <CardDescription>Gemini AI creates the following for each entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Globe, label: "URL Slug", desc: "Clean, readable URL from the entry title (e.g. /entry/tech-conference-2024)" },
              { icon: FileText, label: "Meta Title", desc: "SEO-optimized <title> tag (50–60 characters)" },
              { icon: Tag, label: "Meta Description", desc: "Compelling <meta name=\"description\"> (140–160 characters)" },
              { icon: Sparkles, label: "Open Graph Tags", desc: "og:title and og:description for social sharing" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Options + Action */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generate SEO with Gemini</CardTitle>
          <CardDescription>
            By default only entries missing SEO data will be processed. Toggle below to regenerate all.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Switch
              id="overwrite"
              checked={overwrite}
              onCheckedChange={setOverwrite}
              disabled={isRunning}
            />
            <Label htmlFor="overwrite" className="cursor-pointer">
              Regenerate SEO for entries that already have it
              {overwrite && (
                <Badge variant="secondary" className="ml-2 text-xs">All {summary?.total ?? ""} entries</Badge>
              )}
              {!overwrite && summary && summary.missingSeo > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">{summary.missingSeo} entries</Badge>
              )}
            </Label>
          </div>

          <Separator />

          {/* Progress area */}
          {job && (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between text-sm">
                <span className={
                  job.status === "complete" ? "text-green-600 dark:text-green-500 font-medium" :
                  job.status === "error" ? "text-destructive font-medium" :
                  "text-muted-foreground"
                }>
                  {job.status === "complete" && <CheckCircle2 className="h-4 w-4 inline mr-1" />}
                  {job.status === "error" && <AlertCircle className="h-4 w-4 inline mr-1" />}
                  {job.status === "running" && <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />}
                  {job.message}
                </span>
                <span className="text-muted-foreground font-mono">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
              {job.total > 0 && (
                <p className="text-xs text-muted-foreground">{job.processed} of {job.total} entries processed</p>
              )}
              {job.error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{job.error}</p>
              )}
            </div>
          )}

          <Button
            onClick={handleBulkGenerate}
            disabled={isRunning || (summary?.missingSeo === 0 && !overwrite)}
            size="lg"
            className="w-full sm:w-auto gap-2"
          >
            {isRunning ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating SEO…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Bulk Generate SEO with Gemini</>
            )}
          </Button>
          {summary?.missingSeo === 0 && !overwrite && !isRunning && (
            <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              All entries already have SEO data. Toggle "Regenerate" above to refresh them.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
