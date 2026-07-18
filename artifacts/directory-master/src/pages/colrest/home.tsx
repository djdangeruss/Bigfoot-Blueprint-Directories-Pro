import { Link } from "wouter";
import { useListPublicEntries } from "@workspace/api-client-react";
import { Loader2, ArrowRight } from "lucide-react";
import { parseListing } from "@/lib/colrest";
import { FeaturedCard, StandardCard } from "@/components/colrest/ListingCard";
import { useI18n, localizedCategory } from "@/i18n";

export default function ColrestHome() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useListPublicEntries({ limit: 100 });

  const listings = (data?.entries ?? []).map(parseListing);
  const featured = listings.filter(l => l.featured).slice(0, 2);
  const topRated = listings
    .filter(l => !l.featured && l.aggRating != null && l.aggReviewCount >= 25)
    .sort((a, b) => (b.aggRating! - a.aggRating!) || (b.aggReviewCount - a.aggReviewCount))
    .slice(0, 6);
  const categories = [...new Set(listings.map(l => l.category).filter(Boolean))] as string[];
  const cities = [...new Set(listings.map(l => l.location).filter(Boolean))] as string[];

  return (
    <div>
      {/* Hero — fonda at dusk. CSS-only; imagery can be layered in later. */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, var(--fonda-cafe) 0%, #3a2418 60%, #4a2c1c 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <h1 className="font-display font-semibold text-4xl md:text-6xl leading-tight max-w-3xl mx-auto" style={{ color: "var(--fonda-arepa)" }}>
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 text-base md:text-lg max-w-2xl mx-auto" style={{ color: "color-mix(in srgb, var(--fonda-arepa) 75%, transparent)" }}>
            {t.home.heroSubtitle}
          </p>
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
