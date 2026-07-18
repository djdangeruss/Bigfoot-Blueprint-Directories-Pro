import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Clock3, BarChart3, Star, Camera, UtensilsCrossed, X, Check } from "lucide-react";
import { ownerApi, getOwnerToken, setOwnerToken, OwnerApiError } from "@/lib/ownerApi";
import { useI18n } from "@/i18n";
import type { Tier } from "@/lib/colrest";

const TIER_ORDER: Tier[] = ["free", "basic", "pro", "premium"];

// Owner dashboard: listing editor with tier caps enforced by the API and made
// visible in the UI. Locked features are shown (not hidden) with a real
// "request upgrade" path — no dead buttons.
export default function OwnerDashboard() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-listing"],
    queryFn: () => ownerApi.listing(),
    enabled: Boolean(getOwnerToken()),
    retry: false,
  });

  useEffect(() => {
    if (!getOwnerToken() || (error instanceof OwnerApiError && error.status === 401)) {
      setOwnerToken(null);
      setLocation("/owner/login");
    }
  }, [error]);

  const listing = data?.listing;
  const tier: Tier = (data?.tier as Tier) ?? "free";
  const limits = data?.limits ?? { photos: 1, menuUrl: false, analytics: false, featured: false };
  const cf = (listing?.customFields ?? {}) as Record<string, unknown>;

  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [menuUrl, setMenuUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhoto, setNewPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState<Tier | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [upgradeSent, setUpgradeSent] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setHours(typeof cf.hours === "string" ? cf.hours : "");
    setDescription(typeof cf.ownerDescription === "string" ? cf.ownerDescription : "");
    setMenuUrl(typeof cf.menuUrl === "string" ? cf.menuUrl : "");
    setPhotos(Array.isArray(cf.photos) ? cf.photos.map(String) : []);
  }, [listing?.id]);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const patch: Record<string, unknown> = { hours, ownerDescription: description, photos };
      if (limits.menuUrl) patch.menuUrl = menuUrl;
      await ownerApi.updateListing(patch as any);
      setNotice({ kind: "ok", text: t.owner.saved });
      qc.invalidateQueries({ queryKey: ["owner-listing"] });
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof OwnerApiError ? err.message : t.common.error });
    } finally {
      setSaving(false);
    }
  };

  const sendUpgrade = async () => {
    if (!upgradeOpen) return;
    try {
      await ownerApi.requestUpgrade(upgradeOpen, upgradeMsg || undefined);
      setUpgradeSent(true);
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof OwnerApiError ? err.message : t.common.error });
      setUpgradeOpen(null);
    }
  };

  const signOut = async () => {
    try { await ownerApi.logout(); } catch { /* ignore */ }
    setOwnerToken(null);
    setLocation("/");
  };

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Claim still pending — show status, not a dead end.
  if (!listing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Clock3 className="h-10 w-10 mx-auto text-accent" />
        <h1 className="font-display text-2xl font-semibold mt-4">{t.owner.pendingTitle}</h1>
        <p className="text-muted-foreground mt-2">{t.owner.pendingBody}</p>
        {(data?.pendingClaims ?? []).map(c => (
          <p key={c.id} className="text-xs text-muted-foreground mt-3 tnum">
            #{c.id} · {c.method === "domain-match" ? t.admin.domainMatch : t.admin.manualReview} · {new Date(c.createdAt).toLocaleDateString()}
          </p>
        ))}
        <button onClick={signOut} className="mt-8 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
          {t.owner.signOut}
        </button>
      </div>
    );
  }

  const tierLabel: Record<Tier, string> = {
    free: t.owner.tierFree, basic: t.owner.tierBasic, pro: t.owner.tierPro, premium: t.owner.tierPremium,
  };
  const inputCls = "w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.owner.dashTitle}</p>
          <h1 className="font-display text-3xl font-semibold mt-0.5">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="seal-verificado">✓ {t.entry.verified}</span>
            <span className="text-xs font-bold uppercase tracking-wide rounded-full border border-accent text-accent px-2.5 py-0.5">
              {t.owner.tier}: {tierLabel[tier]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/entry/${listing.slug || listing.id}`} className="text-sm font-medium text-primary hover:underline">
            → {listing.slug || listing.id}
          </Link>
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">{t.owner.signOut}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="toldo" aria-hidden />
            <div className="p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold">{t.owner.editListing}</h2>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t.owner.hoursLabel}</label>
                <input type="text" value={hours} onChange={e => setHours(e.target.value)} placeholder={t.owner.hoursPlaceholder} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t.owner.descriptionLabel}</label>
                <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={t.owner.descriptionPlaceholder} className={inputCls} />
              </div>

              {/* Menu link — tier-gated */}
              <div className={limits.menuUrl ? "" : "opacity-60"}>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <UtensilsCrossed className="h-4 w-4" /> {t.owner.menuUrlLabel}
                  {!limits.menuUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground">
                      <Lock className="h-3 w-3" /> {t.owner.locked}
                    </span>
                  )}
                </label>
                {limits.menuUrl ? (
                  <input type="url" value={menuUrl} onChange={e => setMenuUrl(e.target.value)} placeholder="https://…" className={inputCls} />
                ) : (
                  <button onClick={() => setUpgradeOpen("basic")} className="text-sm text-primary font-medium hover:underline">
                    {t.owner.upgradeToUnlock} → {t.owner.tierBasic}
                  </button>
                )}
              </div>

              {/* Photos — tier-capped */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <Camera className="h-4 w-4" /> {t.owner.photosLabel}
                  <span className="text-[11px] text-muted-foreground font-normal">{t.owner.photoLimit(limits.photos)}</span>
                </label>
                <div className="space-y-2">
                  {photos.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={p} alt="" className="h-10 w-10 rounded object-cover border border-border" onError={e => { (e.target as HTMLImageElement).style.visibility = "hidden"; }} />
                      <span className="text-xs text-muted-foreground truncate flex-1">{p}</span>
                      <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {photos.length < limits.photos ? (
                    <div className="flex gap-2">
                      <input type="url" value={newPhoto} onChange={e => setNewPhoto(e.target.value)} placeholder={t.owner.photoUrlPlaceholder} className={inputCls} />
                      <button
                        onClick={() => { if (newPhoto.trim()) { setPhotos(ps => [...ps, newPhoto.trim()]); setNewPhoto(""); } }}
                        className="flex-shrink-0 rounded-md border border-border px-4 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                      >
                        {t.owner.addPhoto}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setUpgradeOpen(TIER_ORDER[Math.min(TIER_ORDER.indexOf(tier) + 1, 3)])} className="text-sm text-primary font-medium hover:underline">
                      {t.owner.upgradeToUnlock}
                    </button>
                  )}
                </div>
              </div>

              {notice && (
                <p className={`text-sm ${notice.kind === "ok" ? "" : "text-destructive"}`} style={notice.kind === "ok" ? { color: "var(--trust-positive)" } : undefined}>
                  {notice.kind === "ok" && <Check className="inline h-4 w-4 mr-1" />}{notice.text}
                </p>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-primary text-primary-foreground px-7 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? t.owner.saving : t.owner.save}
              </button>
            </div>
          </div>

          {/* Analytics — pro+ */}
          <div className={`rounded-lg border border-card-border bg-card p-6 ${limits.analytics ? "" : "opacity-70"}`}>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <BarChart3 className="h-5 w-5" /> {t.owner.analytics}
              {!limits.analytics && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground">
                  <Lock className="h-3 w-3" /> {t.owner.locked}
                </span>
              )}
            </h2>
            {limits.analytics ? (
              <p className="text-sm text-muted-foreground mt-2">
                GA4 listing-level views/clicks land here at deploy (dataLayer events are already firing on the public pages).
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">{t.owner.analyticsLocked}</p>
                <button onClick={() => setUpgradeOpen("pro")} className="mt-2 text-sm text-primary font-medium hover:underline">
                  {t.owner.upgradeToUnlock} → {t.owner.tierPro}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tier ladder */}
        <aside className="space-y-3">
          {TIER_ORDER.map(tk => {
            const active = tk === tier;
            const below = TIER_ORDER.indexOf(tk) < TIER_ORDER.indexOf(tier);
            return (
              <div key={tk} className={`rounded-lg border p-4 ${active ? "border-primary bg-primary/5" : "border-card-border bg-card"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold flex items-center gap-1.5">
                    {tk === "premium" && <Star className="h-4 w-4" style={{ color: "var(--fonda-panela)" }} />}
                    {t.tiers[tk].name}
                  </span>
                  {active && <span className="text-[11px] font-bold uppercase text-primary">✓</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.tiers[tk].blurb}</p>
                {!active && !below && (
                  <button
                    onClick={() => setUpgradeOpen(tk)}
                    className="mt-3 w-full rounded-full border border-primary text-primary text-xs font-semibold py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {t.owner.requestUpgrade}
                  </button>
                )}
              </div>
            );
          })}
        </aside>
      </div>

      {/* Upgrade request modal */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => { setUpgradeOpen(null); setUpgradeSent(false); }}>
          <div className="w-full max-w-md rounded-lg bg-card border border-card-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="toldo-stripes" aria-hidden />
            <div className="p-6">
              {upgradeSent ? (
                <div className="text-center py-4">
                  <Check className="h-9 w-9 mx-auto" style={{ color: "var(--trust-positive)" }} />
                  <p className="font-medium mt-3">{t.owner.upgradeSent}</p>
                  <button onClick={() => { setUpgradeOpen(null); setUpgradeSent(false); }} className="mt-5 text-sm text-muted-foreground hover:text-foreground underline">OK</button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-semibold">
                    {t.owner.upgradeTitle} — {t.tiers[upgradeOpen].name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">{t.owner.upgradeBody}</p>
                  <textarea
                    rows={3}
                    value={upgradeMsg}
                    onChange={e => setUpgradeMsg(e.target.value)}
                    placeholder={t.owner.upgradeMessage}
                    className={`${inputCls} mt-4`}
                  />
                  <div className="flex gap-3 mt-5">
                    <button onClick={sendUpgrade} className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90">
                      {t.owner.requestUpgrade}
                    </button>
                    <button onClick={() => setUpgradeOpen(null)} className="rounded-full border border-border px-5 text-sm font-medium">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
