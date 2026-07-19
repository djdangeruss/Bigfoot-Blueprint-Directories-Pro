import { Link } from "wouter";
import { ArrowUpRight, MapPin, ShieldCheck, Sparkles, UtensilsCrossed } from "lucide-react";
import type { ColrestListing } from "@/lib/colrest";
import { TrustCompact } from "./TrustSignals";
import { useI18n, localizedCategory } from "@/i18n";

export function Toldo({ listing }: { listing: ColrestListing }) {
  if (listing.featured) return <div className="toldo-stripes" aria-hidden />;
  if (listing.claimStatus === "claimed") return <div className="toldo" aria-hidden />;
  return <div className="toldo-unclaimed" aria-hidden />;
}

function href(listing: ColrestListing) {
  return `/entry/${listing.slug || listing.id}`;
}

function primaryPhoto(listing: ColrestListing) {
  if (listing.claimStatus !== "claimed") return null;
  return listing.photos.find(Boolean) || listing.photoUrl || null;
}

function ListingVisual({ listing, featured = false }: { listing: ColrestListing; featured?: boolean }) {
  const photo = primaryPhoto(listing);
  const place = listing.neighborhood || listing.location?.split(",")[0] || "South Florida";
  return (
    <div className={`listing-card-visual ${featured ? "min-h-48" : "min-h-36"}`}>
      {photo ? (
        <img
          src={photo}
          alt={`${listing.title} — owner-supplied restaurant photo`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          onError={event => { (event.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="listing-card-pattern absolute inset-0" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/5" aria-hidden />
      <div className="relative z-10 flex h-full min-h-inherit flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
            <MapPin className="h-3 w-3" /> {place}
          </span>
          {listing.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-stone-900">
              <Sparkles className="h-3 w-3 text-primary" /> Featured
            </span>
          )}
        </div>
        {!photo && (
          <div className="flex items-end justify-between gap-3 pt-8">
            <UtensilsCrossed className="h-8 w-8 text-white/85" strokeWidth={1.4} />
            <span className="max-w-44 text-right text-xs font-medium leading-snug text-white/80">
              Colombian restaurant discovery
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DirectoryCard({ listing, featured = false, decorative = false }: { listing: ColrestListing; featured?: boolean; decorative?: boolean }) {
  const { t, lang } = useI18n();
  const claimed = listing.claimStatus === "claimed";
  return (
    <Link href={href(listing)} tabIndex={decorative ? -1 : undefined} className={`group block h-full ${featured ? "md:col-span-2" : ""}`}>
      <article data-spotlight-card className="directory-card h-full overflow-hidden rounded-[1.35rem] border border-card-border/80 bg-card">
        <ListingVisual listing={listing} featured={featured} />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {localizedCategory(listing.category, lang)}
              </p>
              <h3 className={`${featured ? "text-2xl" : "text-xl"} font-display font-semibold leading-tight text-foreground group-hover:text-primary transition-colors`}>
                {listing.title}
              </h3>
            </div>
            {claimed && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-secondary/12 px-2.5 py-1 text-[11px] font-bold text-secondary" title={t.entry.verifiedMeaning}>
                <ShieldCheck className="h-3.5 w-3.5" /> {t.entry.verified}
              </span>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-2">{[listing.venue, listing.location].filter(Boolean).join(" · ")}</span>
          </p>

          {listing.signatureDishes && (
            <p className="line-clamp-1 text-sm text-foreground/72">{listing.signatureDishes}</p>
          )}

          <div className="mt-auto border-t border-border/70 pt-3">
            <TrustCompact listing={listing} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {listing.platforms.length} {t.browse.reputationSources}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                {t.browse.viewDetails} <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function FeaturedCard({ listing }: { listing: ColrestListing }) {
  return <DirectoryCard listing={listing} featured />;
}

export function StandardCard({ listing, decorative = false }: { listing: ColrestListing; decorative?: boolean }) {
  return <DirectoryCard listing={listing} decorative={decorative} />;
}

// Kept as a compatibility export for older instance code. Colombian Restaurant
// builds now give every published venue the same useful card baseline.
export function MenuLineItem({ listing }: { listing: ColrestListing }) {
  return <StandardCard listing={listing} />;
}
