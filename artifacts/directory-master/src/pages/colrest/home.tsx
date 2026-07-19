import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListPublicEntries } from "@workspace/api-client-react";
import { ArrowRight, CheckCircle2, Compass, Loader2, Search, ShieldCheck, Sparkles, Store } from "lucide-react";
import { parseListing, type ColrestListing } from "@/lib/colrest";
import { StandardCard } from "@/components/colrest/ListingCard";
import { useI18n, localizedCategory } from "@/i18n";

function RestaurantRail({ listings }: { listings: ColrestListing[] }) {
  const cards = listings.map(listing => (
    <div key={listing.id} className="marquee-card"><StandardCard listing={listing} /></div>
  ));
  return (
    <div className="discovery-marquee" aria-label="Restaurant discovery carousel">
      <div className="discovery-track">
        <div className="discovery-group">{cards}</div>
        <div className="discovery-group" aria-hidden="true" {...({ inert: "" } as any)}>{listings.map(listing => <div key={`copy-${listing.id}`} className="marquee-card"><StandardCard listing={listing} decorative /></div>)}</div>
      </div>
    </div>
  );
}

function FlavorRail({ items }: { items: string[] }) {
  const { lang } = useI18n();
  const pills = items.map((item, index) => (
    <Link key={`${item}-${index}`} href={`/browse?search=${encodeURIComponent(item.split(",")[0])}`} className="flavor-pill">
      <Sparkles className="h-3.5 w-3.5" /> {localizedCategory(item, lang)}
    </Link>
  ));
  return (
    <div className="discovery-marquee discovery-marquee-reverse" aria-label="Cities and Colombian flavors">
      <div className="discovery-track">
        <div className="discovery-group discovery-pill-group">{pills}</div>
        <div className="discovery-group discovery-pill-group" aria-hidden="true" {...({ inert: "" } as any)}>{items.map((item, index) => <Link key={`copy-${item}-${index}`} tabIndex={-1} href={`/browse?search=${encodeURIComponent(item.split(",")[0])}`} className="flavor-pill"><Sparkles className="h-3.5 w-3.5" /> {localizedCategory(item, lang)}</Link>)}</div>
      </div>
    </div>
  );
}

export default function ColrestHome() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useListPublicEntries({ limit: 100 });

  const listings = (data?.entries ?? []).map(parseListing);
  const highlyReviewed = listings
    .filter(listing => listing.aggRating != null && listing.aggReviewCount >= 25)
    .sort((a, b) => (b.aggRating! - a.aggRating!) || (b.aggReviewCount - a.aggReviewCount))
    .slice(0, 8);
  const categories = [...new Set(listings.map(listing => listing.category).filter(Boolean))] as string[];
  const cities = [...new Set(listings.map(listing => listing.location?.split(",")[0].trim()).filter(Boolean))] as string[];
  const sourceCount = new Set(listings.flatMap(listing => listing.platforms.map(platform => platform.platform))).size;
  const flavorItems = [...cities.slice(0, 7), ...categories.slice(0, 5)];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) setLocation(`/browse?search=${encodeURIComponent(query.trim())}`);
    else setLocation("/browse");
  };

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-border/70 bg-card">
        <div className="hero-orb hero-orb-one" aria-hidden />
        <div className="hero-orb hero-orb-two" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/8 px-3.5 py-2 text-xs font-bold text-secondary">
              <Compass className="h-4 w-4" /> {t.home.coverage}
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.96] tracking-[-.04em] text-foreground sm:text-6xl lg:text-7xl">
              {t.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t.home.heroSubtitle}
            </p>

            <form onSubmit={submitSearch} role="search" className="hero-search mt-8 max-w-2xl">
              <label htmlFor="hero-directory-search" className="sr-only">{t.home.searchLabel}</label>
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="hero-directory-search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full rounded-full border border-input bg-background py-4 pl-14 pr-40 text-base text-foreground shadow-[0_18px_60px_-28px_rgba(36,24,18,.55)] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/12"
              />
              <button type="submit" className="absolute bottom-2 right-2 top-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg">
                {t.nav.browse} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-secondary" /> {t.home.coverageNote}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
            <div className="hero-image-shell">
              <img src="/images/colombian-table-editorial-v1.jpg" alt="A shared Colombian meal in a warm, editorial setting" className="h-[28rem] w-full object-cover sm:h-[34rem]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" aria-hidden />
              <div className="absolute bottom-5 left-5 right-5 rounded-[1.2rem] border border-white/20 bg-black/25 p-4 text-white backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-white/70">{t.home.madeForDiscovery}</p>
                <p className="mt-1 font-display text-xl font-semibold">{t.home.heroCaption}</p>
              </div>
            </div>
            <div className="hero-float-card hero-float-card-left"><ShieldCheck className="h-5 w-5 text-secondary" /><span>{t.home.sourceAttributed}</span></div>
            <div className="hero-float-card hero-float-card-right"><Sparkles className="h-5 w-5 text-primary" /><span>{t.home.bilingualDiscovery}</span></div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border/70 px-4 py-7 sm:px-6 lg:px-8">
          {[
            [listings.length, t.home.restaurantCount],
            [cities.length, t.home.cityCount],
            [sourceCount, t.home.sourceCount],
          ].map(([value, label]) => (
            <div key={String(label)} className="px-3 text-center sm:px-8">
              <div className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[.11em] text-muted-foreground sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {highlyReviewed.length > 0 && (
            <section className="py-16 md:py-20">
              <div className="mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-4 px-4 sm:px-6 md:flex-row md:items-end lg:px-8">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-primary">{t.home.discoveryRail}</p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.home.highlyReviewed}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.home.highlyReviewedNote}</p>
                </div>
                <div className="flex gap-4 text-sm font-bold">
                  <Link href="/methodology" className="text-muted-foreground hover:text-foreground">{t.home.methodology}</Link>
                  <Link href="/browse" className="inline-flex items-center gap-1 text-primary">{t.home.browseAll} <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
              <RestaurantRail listings={highlyReviewed} />
            </section>
          )}

          {flavorItems.length > 0 && (
            <section className="border-y border-border/60 bg-card/65 py-11">
              <div className="mx-auto mb-5 max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-sm font-bold uppercase tracking-[.16em] text-muted-foreground">{t.home.flavorRail}</h2>
              </div>
              <FlavorRail items={flavorItems} />
            </section>
          )}

          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-20">
            <div className="trust-panel-card">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/12 text-secondary"><ShieldCheck className="h-6 w-6" /></div>
              <h2 className="font-display text-3xl font-semibold">{t.home.trustTitle}</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{t.home.trustBody}</p>
              <Link href="/methodology" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-secondary">{t.browse.methodologyLink} <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="owner-panel-card">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white"><Store className="h-6 w-6" /></div>
              <h2 className="font-display text-3xl font-semibold text-white">{t.home.ownerCta}</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/75">{t.home.ownerCtaBody}</p>
              <Link href="/browse" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5 hover:shadow-xl">{t.home.findYourRestaurant} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
