import { useMemo, useState } from "react";
import { useParams } from "wouter";
import { useListPublicEntries } from "@workspace/api-client-react";
import { Loader2, Search } from "lucide-react";
import { parseListing, type ColrestListing } from "@/lib/colrest";
import { FeaturedCard, StandardCard, MenuLineItem } from "@/components/colrest/ListingCard";
import { useI18n, localizedCategory } from "@/i18n";

type SortKey = "rating" | "reviews" | "az" | "newest";

// Menu-board browse: claimed/featured listings live in the card grid up top;
// unclaimed listings render as quiet menu lines below — the ascension ladder
// made visible.
export default function ColrestBrowse() {
  const { t, lang } = useI18n();
  const params = useParams();
  const categoryParam = params.category ? decodeURIComponent(params.category) : null;
  const initialSearch = new URLSearchParams(window.location.search).get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortKey>("rating");

  // 61 listings today — fetch once, filter/sort client-side. Revisit pagination
  // when a metro pushes this past a few hundred.
  const { data, isLoading } = useListPublicEntries({ limit: 100, category: categoryParam || undefined });

  const all = useMemo(() => (data?.entries ?? []).map(parseListing), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = all;
    if (q) {
      rows = rows.filter(l =>
        [l.title, l.location, l.venue, l.neighborhood, l.category, l.signatureDishes, l.atmosphere]
          .some(v => v && v.toLowerCase().includes(q)),
      );
    }
    const sorted = [...rows];
    switch (sort) {
      case "rating":  sorted.sort((a, b) => (b.aggRating ?? 0) - (a.aggRating ?? 0) || b.aggReviewCount - a.aggReviewCount); break;
      case "reviews": sorted.sort((a, b) => b.aggReviewCount - a.aggReviewCount); break;
      case "az":      sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "newest":  break; // API default order
    }
    return sorted;
  }, [all, search, sort]);

  const featured = filtered.filter(l => l.featured);
  const claimed = filtered.filter(l => !l.featured && l.claimStatus === "claimed");
  const unclaimed = filtered.filter(l => !l.featured && l.claimStatus !== "claimed");

  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: "rating", label: t.browse.sortRating },
    { key: "reviews", label: t.browse.sortReviews },
    { key: "az", label: t.browse.sortAZ },
    { key: "newest", label: t.browse.sortNewest },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {categoryParam ? localizedCategory(categoryParam, lang) : t.browse.title}
          </h1>
          <p className="text-muted-foreground mt-1 tnum">
            {filtered.length} {t.browse.results}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <label htmlFor="browse-directory-search" className="sr-only">{t.browse.searchLabel}</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="browse-directory-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="pl-9 pr-3 py-2 rounded-full border border-input bg-card text-sm w-56 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex rounded-full border border-border overflow-hidden">
            {sortOptions.map(o => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                aria-pressed={sort === o.key}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  sort === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">{t.browse.noResults}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {(featured.length > 0 || claimed.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {featured.map(l => <FeaturedCard key={l.id} listing={l} />)}
              {claimed.map(l => (
                <div key={l.id} className="md:col-span-1"><StandardCard listing={l} /></div>
              ))}
              {/* While claimed inventory is thin, the open grid space sells the
                  claim itself instead of sitting empty. */}
              {featured.length * 2 + claimed.length < 4 && unclaimed.length > 0 && (
                <div className="md:col-span-2 rounded-lg border-2 border-dashed border-border bg-card/40 p-6 flex flex-col justify-center items-start gap-2">
                  <div className="toldo-unclaimed w-24 rounded" aria-hidden />
                  <h3 className="font-display text-lg font-semibold mt-1">{t.browse.ctaCardTitle}</h3>
                  <p className="text-sm text-muted-foreground">{t.browse.ctaCardBody}</p>
                </div>
              )}
            </div>
          )}

          {unclaimed.length > 0 && (
            <section>
              {(featured.length > 0 || claimed.length > 0) && (
                <h2 className="font-display text-lg font-medium text-muted-foreground mb-3">
                  {t.browse.unclaimedSection}
                </h2>
              )}
              <div className="rounded-lg border border-border bg-card/60 px-4 py-2 divide-y divide-border/60">
                {unclaimed.map(l => <MenuLineItem key={l.id} listing={l} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
