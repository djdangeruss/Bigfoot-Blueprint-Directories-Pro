// Typed view over the colrest entry customFields blob: three review platforms,
// claim state, subscription tier, and owner-edited content.

export type ClaimStatus = "unclaimed" | "pending" | "claimed";
export type Tier = "free" | "basic" | "pro" | "premium";

export interface PlatformScore {
  platform: "google" | "yelp" | "tripadvisor";
  label: string;
  rating: number;
  reviewCount: number;
  positivePct: number | null;
  negativePct: number | null;
  url: string | null;
}

export interface ColrestListing {
  id: number;
  title: string;
  category: string | null;
  slug: string | null;
  venue: string | null;       // street address
  location: string | null;    // city, state
  contactPhone: string | null;
  website: string | null;
  photoUrl: string | null;
  atmosphere: string | null;
  neighborhood: string | null;
  signatureDishes: string | null;
  hours: string | null;
  ownerDescription: string | null;
  menuUrl: string | null;
  photos: string[];
  claimStatus: ClaimStatus;
  tier: Tier;
  featured: boolean;
  platforms: PlatformScore[];
  aggRating: number | null;
  aggReviewCount: number;
  positivePct: number | null;
  negativePct: number | null;
  replyDelayDays: number | null;
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace("%", ""));
  return Number.isFinite(n) ? n : null;
}

export function parseListing(entry: any): ColrestListing {
  const cf: Record<string, unknown> = (entry?.customFields && typeof entry.customFields === "object") ? entry.customFields : {};

  const platforms: PlatformScore[] = [];
  const g = num(cf.rating), gc = num(cf.reviewCount);
  if (g != null) platforms.push({ platform: "google", label: "Google", rating: g, reviewCount: gc ?? 0, positivePct: num(cf.reviewPositivePct), negativePct: num(cf.reviewNegativePct), url: null });
  const y = num(cf.yelpRating), yc = num(cf.yelpReviewCount);
  if (y != null) platforms.push({ platform: "yelp", label: "Yelp", rating: y, reviewCount: yc ?? 0, positivePct: num(cf.yelpPositivePct), negativePct: num(cf.yelpNegativePct), url: typeof cf.yelpUrl === "string" ? cf.yelpUrl : null });
  const t = num(cf.tripadvisorRating), tc = num(cf.tripadvisorReviewCount);
  if (t != null) platforms.push({ platform: "tripadvisor", label: "TripAdvisor", rating: t, reviewCount: tc ?? 0, positivePct: num(cf.tripadvisorPositivePct), negativePct: num(cf.tripadvisorNegativePct), url: typeof cf.tripadvisorUrl === "string" ? cf.tripadvisorUrl : null });

  // review-count-weighted average across platforms
  const totalReviews = platforms.reduce((s, p) => s + p.reviewCount, 0);
  const aggRating = platforms.length
    ? (totalReviews > 0
        ? platforms.reduce((s, p) => s + p.rating * p.reviewCount, 0) / totalReviews
        : platforms.reduce((s, p) => s + p.rating, 0) / platforms.length)
    : null;

  // sentiment: prefer Google's (largest sample), fall back to any platform
  const sentimentSource = platforms.find(p => p.positivePct != null);

  const claimStatus: ClaimStatus =
    cf.claimStatus === "claimed" ? "claimed" : cf.claimStatus === "pending" ? "pending" : "unclaimed";
  const tier: Tier = (["free", "basic", "pro", "premium"] as Tier[]).includes(cf.subscriptionTier as Tier)
    ? (cf.subscriptionTier as Tier) : "free";

  return {
    id: entry.id,
    title: entry.title,
    category: entry.category ?? null,
    slug: entry.slug ?? null,
    venue: entry.venue ?? null,
    location: entry.location ?? null,
    contactPhone: entry.contactPhone ?? null,
    website: entry.website ?? null,
    photoUrl: typeof cf.photoUrl === "string" ? cf.photoUrl : null,
    atmosphere: typeof cf.atmosphere === "string" ? cf.atmosphere : null,
    neighborhood: typeof cf.neighborhood === "string" ? cf.neighborhood : null,
    signatureDishes: typeof cf.signatureDishes === "string" ? cf.signatureDishes : null,
    hours: typeof cf.hours === "string" ? cf.hours : null,
    ownerDescription: typeof cf.ownerDescription === "string" ? cf.ownerDescription : null,
    menuUrl: typeof cf.menuUrl === "string" ? cf.menuUrl : null,
    photos: Array.isArray(cf.photos) ? cf.photos.map(String) : [],
    claimStatus,
    tier,
    featured: Boolean(entry.featured) || tier === "premium",
    platforms,
    aggRating,
    aggReviewCount: totalReviews,
    positivePct: sentimentSource?.positivePct ?? null,
    negativePct: sentimentSource?.negativePct ?? null,
    replyDelayDays: num(cf.ownerReplyDelayDays),
  };
}

export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event, ...params });
  }
}
