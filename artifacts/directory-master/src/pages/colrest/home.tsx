import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListPublicEntries } from "@workspace/api-client-react";
import { Loader2, ArrowRight, Search } from "lucide-react";
import { parseListing } from "@/lib/colrest";
import { FeaturedCard, StandardCard } from "@/components/colrest/ListingCard";
import { useI18n, localizedCategory } from "@/i18n";

export default function ColrestHome() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useListPublicEntries({ limit: 100 });

  const listings = (data?.entries ?? []).map(parseListing);
  const featured = listings.filter(l => l.featured).slice(0, 2);
  const topRated = listings
    .filter(l => !l.featured && l.aggRating != null && l.aggReviewCount >= 25)
    .sort((a, b) => (b.aggRating! - a.aggRating!) || (b.aggReviewCount - a.aggReviewCount))
    .slice(0, 6);
  const categories = [...new Set(listings.map(l => l.category).filter(Boolean))] as string[];
  const cities = [...new Set(listings.map(l => l.location).filter(Boolean))] as string[];
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) setLocation(`/browse?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div>
      {/* Hero — fonda at dusk. CSS-only; imagery can be layered in later. */}
      <section className="relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(42,25,17,.91), rgba(42,25,17,.72), rgba(42,25,17,.9)), url('/images/colombian-table-editorial-v1.jpg')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <h1 className="font-display font-semibold text-4xl md:text-6xl leading-tight max-w-3xl mx-auto" style={{ color: "var(--fonda-arepa)" }}>
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 text-base md:text-lg max-w-2xl mx-auto" style={{ color: "color-mix(in srgb, var(--fonda-arepa) 75%, transparent)" }}>
            {t.home.heroSubtitle}
          </p>
          <form onSubmit={submitSearch} role="search" className="relative max-w-2xl mx-auto mt-7">
            <label htmlFor="hero-directory-search" className="sr-only">{t.home.searchLabel}</label>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden />
            <input id="hero-directory-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t.nav.searchPlaceholder} className="w-full rounded-full border-2 border-white/20 bg-background py-4 pl-14 pr-36 text-base text-foreground shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/30" />
            <button type="submit" className="absolute right-2 top-2 bottom-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90">{t.nav.browse}</button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/browse" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm hover:opacity-90 transition-opacity">
              {t.home.browseAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {cities.slice(0, 3).map(c => (
              <Link key={c} href={`/browse?search=${encodeURIComponent(c.split(",")[0])}`} className="rounded-full border px-4 py-2.5 text-sm font-medium transition-colors" style={{ borderColor: "color-mix(in srgb, var(--fonda-arepa) 30%, transparent)", color: "var(--fonda-arepa)" }}>
                {c.split(",")[0]}
              </Link>
            ))}
          </div>
        </div>
        {/* toldo edge into the page */}
        <div className="toldo-hero-edge absolute bottom-0 left-0 right-0" style={{ "--card": "var(--background)" } as React.CSSProperties} />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {featured.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-6">{t.home.featured}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {featured.map(l => <FeaturedCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}

            {topRated.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-2xl font-semibold">★ Top</h2>
                  <Link href="/browse" className="text-sm font-medium text-primary hover:underline">
                    {t.home.browseAll} →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {topRated.map(l => <StandardCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}

            {categories.length > 1 && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-5">{t.home.categories}</h2>
                <div className="flex flex-wrap gap-2.5">
                  {categories.map(c => (
                    <Link key={c} href={`/browse/${encodeURIComponent(c)}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                      {localizedCategory(c, lang)}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
