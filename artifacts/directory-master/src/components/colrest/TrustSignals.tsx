import { Star, MessageCircle } from "lucide-react";
import type { ColrestListing, PlatformScore } from "@/lib/colrest";
import { useI18n } from "@/i18n";

// The three platforms' review data rendered as one trust system: big weighted
// numeral, per-platform rows, a single sentiment bar, and a responsiveness chip.

function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-px" role="img" aria-label={`${rating.toFixed(1)} stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={className}
          style={{
            fill: rating >= i - 0.25 ? "var(--fonda-panela)" : "transparent",
            color: "var(--fonda-panela)",
          }}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

const PLATFORM_MONO: Record<PlatformScore["platform"], string> = {
  google: "G",
  yelp: "Y",
  tripadvisor: "TA",
};

export function SentimentBar({ positive, negative, micro = false }: { positive: number; negative: number; micro?: boolean }) {
  const neutral = Math.max(0, 100 - positive - negative);
  return (
    <div className={`sentiment-bar ${micro ? "sentiment-micro" : ""}`} role="img" aria-label={`${positive}% positive`}>
      <div className="pos" style={{ width: `${positive}%` }} />
      <div style={{ width: `${neutral}%` }} />
      <div className="neg" style={{ width: `${negative}%` }} />
    </div>
  );
}

// Compact strip for cards: avg rating + count + sentiment microbar.
export function TrustCompact({ listing }: { listing: ColrestListing }) {
  const { t } = useI18n();
  if (listing.aggRating == null) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="tnum font-bold text-base leading-none">{listing.aggRating.toFixed(1)}</span>
        <Stars rating={listing.aggRating} />
        <span className="tnum text-xs text-muted-foreground">
          {listing.aggReviewCount.toLocaleString()} {t.entry.reviews}
        </span>
      </div>
      {listing.positivePct != null && (
        <SentimentBar positive={listing.positivePct} negative={listing.negativePct ?? 0} micro />
      )}
    </div>
  );
}

// Full panel for the detail page sidebar.
export function TrustPanel({ listing }: { listing: ColrestListing }) {
  const { t } = useI18n();
  if (listing.platforms.length === 0) return null;
  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-4">{t.entry.reputation}</h3>

      {listing.aggRating != null && (
        <div className="flex items-end gap-3 mb-4">
          <span className="font-display tnum text-5xl font-semibold leading-none">
            {listing.aggRating.toFixed(1)}
          </span>
          <div className="pb-0.5">
            <Stars rating={listing.aggRating} className="h-4 w-4" />
            <div className="tnum text-xs text-muted-foreground mt-1">
              {listing.aggReviewCount.toLocaleString()} {t.entry.reviews}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {listing.platforms.map(p => {
          const row = (
            <div className="flex items-center gap-3 py-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground flex-shrink-0">
                {PLATFORM_MONO[p.platform]}
              </span>
              <span className="text-sm flex-1">{p.label}</span>
              <span className="tnum text-sm font-semibold">{p.rating.toFixed(1)}</span>
              <span className="tnum text-xs text-muted-foreground w-16 text-right">
                {p.reviewCount.toLocaleString()}
              </span>
            </div>
          );
          return p.url ? (
            <a key={p.platform} href={p.url} target="_blank" rel="noopener noreferrer" className="block hover:bg-muted/60 rounded-md px-1 -mx-1 transition-colors">
              {row}
            </a>
          ) : (
            <div key={p.platform} className="px-1 -mx-1">{row}</div>
          );
        })}
      </div>

      {listing.positivePct != null && (
        <div className="mb-3">
          <SentimentBar positive={listing.positivePct} negative={listing.negativePct ?? 0} />
          <div className="text-xs text-muted-foreground mt-1.5">
            <span className="font-semibold" style={{ color: "var(--trust-positive)" }}>
              {Math.round(listing.positivePct)}% {t.entry.positive}
            </span>
          </div>
        </div>
      )}

      {listing.replyDelayDays != null && listing.replyDelayDays <= 14 && (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 bg-secondary/15 text-secondary">
          <MessageCircle className="h-3 w-3" />
          {listing.replyDelayDays <= 3 ? t.entry.respondsFast : t.entry.responds}
        </div>
      )}
      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {t.entry.ratingMethod}
      </p>
    </div>
  );
}
