import { Link } from "wouter";
import { MapPin } from "lucide-react";
import type { ColrestListing } from "@/lib/colrest";
import { TrustCompact } from "./TrustSignals";
import { useI18n, localizedCategory } from "@/i18n";

// Three listing presentations, distinguished by claim state and tier:
//   featured (premium)  — 2-col card, striped toldo, photo hero
//   claimed             — standard card, solid toldo, Verificado seal
//   unclaimed           — quiet menu-line row with dotted leader

export function Toldo({ listing }: { listing: ColrestListing }) {
  if (listing.featured) return <div className="toldo-stripes" aria-hidden />;
  if (listing.claimStatus === "claimed") return <div className="toldo" aria-hidden />;
  return <div className="toldo-unclaimed" aria-hidden />;
}

function href(listing: ColrestListing) {
  return `/entry/${listing.slug || listing.id}`;
}

export function FeaturedCard({ listing }: { listing: ColrestListing }) {
  const { t, lang } = useI18n();
  return (
    <Link href={href(listing)} className="group block md:col-span-2">
      <article className="rounded-lg overflow-hidden border border-card-border bg-card transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg h-full flex flex-col">
        <Toldo listing={listing} />
        {listing.photoUrl && (
          <div className="h-44 overflow-hidden">
            <img
              src={listing.photoUrl}
              alt={listing.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
            />
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-semibold leading-snug">{listing.title}</h3>
            <span className="seal-verificado flex-shrink-0">✓ {t.entry.verified}</span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {listing.neighborhood || listing.location}
            {listing.atmosphere ? ` · ${listing.atmosphere}` : ""}
          </p>
          {listing.signatureDishes && (
            <p className="text-sm line-clamp-1 text-foreground/80 italic">{listing.signatureDishes}</p>
          )}
          <div className="mt-auto pt-2">
            <TrustCompact listing={listing} />
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {localizedCategory(listing.category, lang)}
          </span>
        </div>
      </article>
    </Link>
  );
}

export function StandardCard({ listing }: { listing: ColrestListing }) {
  const { t, lang } = useI18n();
  const claimed = listing.claimStatus === "claimed";
  return (
    <Link href={href(listing)} className="group block">
      <article className="rounded-lg overflow-hidden border border-card-border bg-card transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md h-full flex flex-col">
        <Toldo listing={listing} />
        <div className="p-4 flex-1 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-snug">{listing.title}</h3>
            {claimed && <span className="seal-verificado flex-shrink-0">✓</span>}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{listing.neighborhood || listing.location}</span>
          </p>
          <div className="mt-auto pt-1">
            <TrustCompact listing={listing} />
          </div>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {localizedCategory(listing.category, lang)}
          </span>
        </div>
      </article>
    </Link>
  );
}

// Unclaimed: a single menu line — name ⋯⋯⋯ rating. Deliberately quieter than
// any claimed card; the visual gap IS the claim incentive.
export function MenuLineItem({ listing }: { listing: ColrestListing }) {
  const { t } = useI18n();
  return (
    <Link href={href(listing)} className="group flex items-baseline px-1 py-2.5 rounded-md hover:bg-muted/50 transition-colors">
      <span className="font-display text-[15px] text-foreground/85 group-hover:text-foreground">
        {listing.title}
      </span>
      <span className="menu-leader" aria-hidden />
      {listing.aggRating != null ? (
        <span className="tnum text-sm text-muted-foreground flex-shrink-0">
          ★ {listing.aggRating.toFixed(1)}
          <span className="hidden sm:inline"> · {listing.aggReviewCount.toLocaleString()}</span>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground flex-shrink-0">—</span>
      )}
      <span className="ml-3 flex-shrink-0 text-[11px] font-medium rounded-full border border-border px-2 py-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline">
        {t.entry.claimBanner}
      </span>
    </Link>
  );
}
