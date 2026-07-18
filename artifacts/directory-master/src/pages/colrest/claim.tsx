import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import { ownerApi, setOwnerToken, OwnerApiError } from "@/lib/ownerApi";
import { parseListing, trackEvent } from "@/lib/colrest";
import { useI18n } from "@/i18n";

async function fetchEntry(idOrSlug: string) {
  const res = await fetch(`/api/public/entries/${encodeURIComponent(idOrSlug)}`);
  if (!res.ok) return null;
  return res.json();
}

export default function ColrestClaim() {
  const { t } = useI18n();
  const { id: idOrSlug } = useParams();
  const [, setLocation] = useLocation();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["colrest-entry", idOrSlug],
    queryFn: () => fetchEntry(idOrSlug!),
    enabled: !!idOrSlug,
  });
  const listing = entry ? parseListing(entry) : null;

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await ownerApi.claim({
        entryId: listing.id,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        message: form.message || undefined,
      });
      setOwnerToken(res.token);
      trackEvent("claim_form_submit", { listing_id: listing.id, listing_title: listing.title, method: res.claim.method });
      setDone(true);
    } catch (err) {
      if (err instanceof OwnerApiError && err.status === 409) setError(t.claim.alreadyClaimed);
      else if (err instanceof OwnerApiError) setError(err.message);
      else setError(t.claim.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">{t.entry.notFound}</h1>
        <Link href="/browse" className="inline-block mt-6 text-primary font-medium hover:underline">{t.entry.backToBrowse}</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: "var(--seal)" }} />
        <h1 className="font-display text-3xl font-semibold mt-5">{t.claim.successTitle}</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">{t.claim.successBody}</p>
        <button
          onClick={() => setLocation("/owner")}
          className="mt-8 rounded-full bg-primary text-primary-foreground px-7 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t.claim.goToDashboard}
        </button>
      </div>
    );
  }

  const inputCls = "w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 w-full">
      <Link href={`/entry/${listing.slug || listing.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4" /> {listing.title}
      </Link>

      <h1 className="font-display text-3xl font-semibold">{t.claim.title}</h1>
      <p className="text-muted-foreground mt-2">{t.claim.subtitle}</p>

      <div className="mt-6 rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="toldo-unclaimed" aria-hidden />
        <div className="px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.claim.listingLabel}</p>
          <p className="font-display font-semibold text-lg mt-0.5">{listing.title}</p>
          {listing.venue && <p className="text-sm text-muted-foreground mt-0.5">{listing.venue}</p>}
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.claim.yourName} *</label>
          <input type="text" name="claimName" required value={form.name} onChange={set("name")} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.claim.businessEmail} *</label>
          <input type="email" name="claimEmail" required value={form.email} onChange={set("email")} className={inputCls} />
          <p className="text-xs text-muted-foreground mt-1.5">{t.claim.businessEmailHint}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.claim.phone}</label>
          <input type="tel" name="claimPhone" value={form.phone} onChange={set("phone")} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.claim.password} *</label>
          <input type="password" name="claimPassword" required minLength={8} value={form.password} onChange={set("password")} className={inputCls} />
          <p className="text-xs text-muted-foreground mt-1.5">{t.claim.passwordHint}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.claim.message}</label>
          <textarea name="claimMessage" rows={3} value={form.message} onChange={set("message")} className={inputCls} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {submitting ? t.claim.submitting : t.claim.submit}
        </button>
      </form>
    </div>
  );
}
