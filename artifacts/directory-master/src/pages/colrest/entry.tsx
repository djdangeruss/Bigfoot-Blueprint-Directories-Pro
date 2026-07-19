import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useListPublicEntries } from "@workspace/api-client-react";
import { Loader2, ChevronLeft, Phone, Globe, MapPin, Clock, UtensilsCrossed, ArrowUpRight, Navigation, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { es as dfnsEs } from "date-fns/locale";
import { parseListing } from "@/lib/colrest";
import { trackEvent } from "@/lib/colrest";
import { TrustPanel } from "@/components/colrest/TrustSignals";
import { Toldo, StandardCard } from "@/components/colrest/ListingCard";
import { useI18n, localizedCategory } from "@/i18n";

async function fetchEntry(idOrSlug: string) {
  const res = await fetch(`/api/public/entries/${encodeURIComponent(idOrSlug)}`);
  if (!res.ok) return null;
  return res.json();
}

export default function ColrestEntry() {
  const { t, lang } = useI18n();
  const { id: idOrSlug } = useParams();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["colrest-entry", idOrSlug],
    queryFn: () => fetchEntry(idOrSlug!),
    enabled: !!idOrSlug,
  });

  const listing = entry ? parseListing(entry) : null;

  const { data: relatedData } = useListPublicEntries(
    { category: listing?.category || undefined, limit: 7 },
    { query: { enabled: !!listing?.category } } as any,
  );
  const related = (relatedData?.entries ?? [])
    .map(parseListing)
    .filter(l => l.id !== listing?.id)
    .slice(0, 3);

  useEffect(() => {
    if (!listing) return;
    trackEvent("listing_view", { listing_title: listing.title, listing_category: listing.category ?? undefined, listing_id: listing.id });
    document.title = `${listing.title} | colombianrestaurantnear.me`;
  }, [listing?.id]);

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">{t.entry.notFound}</h1>
        <p className="text-muted-foreground mt-2">{t.entry.notFoundBody}</p>
        <Link href="/browse" className="inline-block mt-6 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold">
          {t.entry.backToBrowse}
        </Link>
      </div>
    );
  }

  const claimed = listing.claimStatus === "claimed";
  const description = listing.ownerDescription || listing.atmosphere || null;
  // Scraped discovery photos are not publication rights. Only render media an
  // approved owner has supplied through the owner-controlled gallery.
  const gallery = claimed ? listing.photos.filter(Boolean) as string[] : [];
  const directionsUrl = listing.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.venue)}`
    : null;

  return (
    <div>
      {/* Header band with toldo edge */}
      <div className="listing-detail-hero relative border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <Link href="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ChevronLeft className="h-4 w-4" /> {t.entry.backToBrowse}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            {listing.category && (
              <Link href={`/browse/${encodeURIComponent(listing.category)}`} className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
                {localizedCategory(listing.category, lang)}
              </Link>
            )}
            {claimed && <span className="seal-verificado" title={t.entry.verifiedMeaning}>✓ {t.entry.verified}<span className="sr-only">: {t.entry.verifiedMeaning}</span></span>}
            {entry.updatedAt && (
              <span className="text-xs text-muted-foreground">
                {t.entry.lastUpdated} {format(new Date(entry.updatedAt), "PP", lang === "es" ? { locale: dfnsEs } : undefined)}
              </span>
            )}
          </div>
          <h1 className="max-w-5xl font-display text-4xl font-semibold leading-[1.02] tracking-[-.035em] md:text-6xl">{listing.title}</h1>
          {(listing.neighborhood || listing.location) && (
            <p className="text-muted-foreground mt-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[listing.venue, listing.location].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="absolute -bottom-[14px] left-0 right-0">
          <Toldo listing={listing} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav aria-label={t.entry.consumerActions} className="mb-10 grid grid-cols-2 gap-3 rounded-[1.35rem] border border-card-border bg-card p-3 shadow-[0_20px_60px_-45px_rgba(36,24,18,.7)] sm:flex sm:flex-wrap">
          {listing.contactPhone && <a href={`tel:${listing.contactPhone}`} onClick={() => trackEvent("listing_contact_click", { contact_method: "phone", listing_title: listing.title })} className="listing-action"><Phone className="h-4 w-4" />{t.entry.call}</a>}
          {directionsUrl && <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("listing_contact_click", { contact_method: "directions", listing_title: listing.title })} className="listing-action"><Navigation className="h-4 w-4" />{t.entry.directions}</a>}
          {listing.website && <a href={listing.website.startsWith("http") ? listing.website : `https://${listing.website}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("listing_contact_click", { contact_method: "website", listing_title: listing.title })} className="listing-action"><Globe className="h-4 w-4" />{t.entry.website}</a>}
          {listing.menuUrl && <a href={listing.menuUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("listing_contact_click", { contact_method: "menu", listing_title: listing.title })} className="listing-action"><UtensilsCrossed className="h-4 w-4" />{t.entry.menu}</a>}
          <Link href={`/corrections?listing=${encodeURIComponent(window.location.href)}`} className="listing-action sm:ml-auto">{t.entry.suggestCorrection} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-10">
            {gallery.length > 0 && (
              <div className={`grid gap-3 ${gallery.length > 1 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}>
                {gallery.slice(0, 6).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${listing.title} ${i + 1}`}
                    loading="lazy"
                    className={`rounded-lg object-cover w-full border border-card-border ${i === 0 && gallery.length > 1 ? "col-span-2 row-span-2 h-full min-h-[16rem]" : "h-40"} ${!claimed ? "grayscale-[35%]" : ""}`}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ))}
              </div>
            )}

            {description && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-3">{t.entry.about}</h2>
                <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">{description}</p>
              </section>
            )}

            {!claimed && (
              <section className="rounded-[1.25rem] border border-secondary/20 bg-secondary/7 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                  <div>
                    <h2 className="font-display text-lg font-semibold">{t.entry.knownDetails}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.entry.unclaimedNote}</p>
                  </div>
                </div>
              </section>
            )}

            {listing.signatureDishes && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-primary" /> Platos
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.signatureDishes.split(",").map((d, i) => (
                    <span key={i} className="rounded-full bg-accent/15 text-foreground px-3.5 py-1.5 text-sm">
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sticky sidebar: trust + contact */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="rounded-lg border border-card-border bg-card p-6">
              <TrustPanel listing={listing} />
              <Link href="/methodology" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-secondary">{t.entry.sourceDetails} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>

            <div className="rounded-lg border border-card-border bg-card p-6 space-y-4">
              {listing.hours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold mb-0.5">{t.entry.hours}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.hours}</div>
                  </div>
                </div>
              )}
              {/* Phone comes from a single data field — swapping to a tracked DNI
                  number later is a data change, not a UI change. */}
              {listing.contactPhone && (
                <a
                  href={`tel:${listing.contactPhone}`}
                  onClick={() => trackEvent("listing_contact_click", { contact_method: "phone", listing_title: listing.title })}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Phone className="h-4 w-4" /> {t.entry.call} · <span className="tnum">{listing.contactPhone}</span>
                </a>
              )}
              {listing.menuUrl && (
                <a
                  href={listing.menuUrl}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent("listing_contact_click", { contact_method: "menu", listing_title: listing.title })}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-secondary text-secondary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <UtensilsCrossed className="h-4 w-4" /> {t.entry.menu}
                </a>
              )}
              {listing.website && (
                <a
                  href={listing.website.startsWith("http") ? listing.website : `https://${listing.website}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent("listing_contact_click", { contact_method: "website", listing_title: listing.title })}
                  className="flex items-center justify-center gap-2 w-full rounded-full border border-border py-3 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" /> {t.entry.website} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent("listing_contact_click", { contact_method: "directions", listing_title: listing.title })}
                  className="flex items-center justify-center gap-2 w-full rounded-full border border-border py-3 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  <MapPin className="h-4 w-4" /> {t.entry.directions} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              {listing.venue && (
                <p className="text-xs text-muted-foreground text-center pt-1">{listing.venue}</p>
              )}
            </div>
          </aside>
        </div>

        {!claimed && (
          <section className="mt-12 overflow-hidden rounded-[1.5rem] bg-primary text-primary-foreground">
            <div className="grid gap-5 px-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center md:px-9">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-white">{t.entry.ownerEyebrow}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">{t.entry.claimBanner}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white">{t.entry.claimPitch}</p>
              </div>
              <Link
                href={`/claim/${listing.slug || listing.id}`}
                onClick={() => trackEvent("claim_cta_click", { listing_id: listing.id, listing_title: listing.title })}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t.entry.claimCta}
              </Link>
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="font-display text-xl font-semibold mb-5">{t.entry.related}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(l => <StandardCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}
      </div>

      {(listing.contactPhone || listing.menuUrl || listing.website || directionsUrl) && (
        <nav aria-label="Restaurant actions" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-border bg-card/95 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur lg:hidden">
          {listing.contactPhone ? <a href={`tel:${listing.contactPhone}`} className="flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"><Phone className="h-4 w-4" />{t.entry.call}</a> : <span />}
          {listing.menuUrl ? <a href={listing.menuUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-secondary px-2 text-xs font-semibold text-secondary-foreground"><UtensilsCrossed className="h-4 w-4" />{t.entry.menu}</a> : listing.website ? <a href={listing.website.startsWith("http") ? listing.website : `https://${listing.website}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-border px-2 text-xs font-semibold"><Globe className="h-4 w-4" />{t.entry.website}</a> : <span />}
          {directionsUrl ? <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-border px-2 text-xs font-semibold"><MapPin className="h-4 w-4" />{t.entry.directions}</a> : <span />}
        </nav>
      )}
    </div>
  );
}
