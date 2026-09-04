import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useListPublicEntries } from "@workspace/api-client-react";
import { ArrowRight, Filter, Loader2, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { parseListing } from "@/lib/colrest";
import { StandardCard } from "@/components/colrest/ListingCard";
import { useI18n, localizedCategory } from "@/i18n";

type SortKey = "rating" | "reviews" | "az" | "newest";

function cityOf(location: string | null) {
  return location?.split(",")[0].trim() || "";
}

export default function ColrestBrowse() {
  const { t, lang } = useI18n();
  const params = useParams();
  const categoryParam = params.category ? decodeURIComponent(params.category) : null;
  const initialParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(initialParams.get("search") || "");
  const [city, setCity] = useState(initialParams.get("city") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(initialParams.get("verified") === "1");
  const [sort, setSort] = useState<SortKey>("rating");

  const { data, isLoading } = useListPublicEntries({ limit: 100, category: categoryParam || undefined });
  const all = useMemo(() => (data?.entries ?? []).map(parseListing), [data]);
  const cities = useMemo(() => [...new Set(all.map(listing => cityOf(listing.location)).filter(Boolean))].sort(), [all]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = all.filter(listing => {
      const matchesQuery = !query || [listing.title, listing.location, listing.venue, listing.neighborhood, listing.category, listing.signatureDishes, listing.atmosphere]
        .some(value => value?.toLowerCase().includes(query));
      const matchesCity = !city || cityOf(listing.location) === city;
      const matchesVerified = !verifiedOnly || listing.claimStatus === "claimed";
      return matchesQuery && matchesCity && matchesVerified;
    });
    rows = [...rows];
    switch (sort) {
      case "rating": rows.sort((a, b) => (b.aggRating ?? 0) - (a.aggRating ?? 0) || b.aggReviewCount - a.aggReviewCount); break;
      case "reviews": rows.sort((a, b) => b.aggReviewCount - a.aggReviewCount); break;
      case "az": rows.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "newest": break;
    }
    return rows;
  }, [all, search, city, verifiedOnly, sort]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (city) query.set("city", city);
    if (verifiedOnly) query.set("verified", "1");
    const next = `${window.location.pathname}${query.size ? `?${query}` : ""}`;
    window.history.replaceState(null, "", next);
  }, [search, city, verifiedOnly]);

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setVerifiedOnly(false);
  };
  const hasFilters = Boolean(search || city || verifiedOnly);
  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: "rating", label: t.browse.sortRating },
    { key: "reviews", label: t.browse.sortReviews },
    { key: "az", label: t.browse.sortAZ },
    { key: "newest", label: t.browse.sortNewest },
  ];

  return (
    <div className="w-full">
      <section className="browse-hero border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-primary">
              <Filter className="h-4 w-4" /> {t.browse.discoveryEyebrow}
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {categoryParam ? localizedCategory(categoryParam, lang) : t.browse.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.browse.browseIntro}</p>
            <Link href="/methodology" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-secondary">
              {t.browse.methodologyLink} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section aria-label={t.browse.filters} className="rounded-[1.4rem] border border-card-border/80 bg-card p-4 shadow-[0_20px_60px_-45px_rgba(36,24,18,.65)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <label htmlFor="browse-directory-search" className="sr-only">{t.browse.searchLabel}</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="browse-directory-search"
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full rounded-full border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="mr-1 hidden h-4 w-4 text-muted-foreground sm:block" />
              {sortOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => setSort(option.key)}
                  aria-pressed={sort === option.key}
                  className={`min-h-10 rounded-full px-3.5 py-2 text-xs font-bold transition ${sort === option.key ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
            <button onClick={() => setCity("")} aria-pressed={!city} className={`filter-chip ${!city ? "filter-chip-active" : ""}`}>{t.browse.allCities}</button>
            {cities.map(value => (
              <button key={value} onClick={() => setCity(value)} aria-pressed={city === value} className={`filter-chip ${city === value ? "filter-chip-active" : ""}`}>{value}</button>
            ))}
            <button onClick={() => setVerifiedOnly(value => !value)} aria-pressed={verifiedOnly} className={`filter-chip inline-flex items-center gap-1.5 ${verifiedOnly ? "filter-chip-active" : ""}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {t.browse.verifiedOnly}
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-primary hover:bg-primary/8">
                <X className="h-3.5 w-3.5" /> {t.browse.clearFilters}
              </button>
            )}
          </div>
        </section>

        <div className="mb-6 mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{filtered.length}</span> {t.browse.results}</p>
          <p className="hidden text-xs text-muted-foreground sm:block">{t.browse.showing} {filtered.length} / {all.length}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-border bg-card/60 py-24 text-center">
            <p className="text-muted-foreground">{t.browse.noResults}</p>
            <button onClick={clearFilters} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">{t.browse.clearFilters}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(listing => <StandardCard key={listing.id} listing={listing} />)}
          </div>
        )}

        <section className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[1.5rem] bg-secondary px-6 py-8 text-secondary-foreground sm:flex-row sm:items-center md:px-9">
          <div>
            <h2 className="font-display text-2xl font-semibold">{t.home.ownerCta}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-foreground/75">{t.home.ownerCtaBody}</p>
          </div>
          <Link href="/owner/login" className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-stone-900">{t.nav.ownerLogin} <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </div>
  );
}
