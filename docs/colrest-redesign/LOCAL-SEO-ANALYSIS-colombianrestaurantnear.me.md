# Colombian Restaurant Near Me — local and programmatic SEO analysis

Date: 2026-07-19

Scope: live production directory after cuisine-scoped publication reconciliation

Status: derived audit; Git, verified runtime, Airtable, events, and SBLO Current Truth retain their scoped authority

## Executive assessment

The directory now has a defensible discovery foundation: 48 operational,
cuisine-qualified Colombian businesses are public; 13 open but non-Colombian
businesses remain preserved and unpublished. Every public record has an exact
Google Place ID, street address, phone number, and compliant Place Photo.

The strongest near-term opportunity is not publishing generic prose. It is
progressively adding owner-verified hours, menus, dishes, neighborhood context,
and corrections to the 29 public pages that currently remain outside the
sitemap/indexability gate.

## Local SEO score: 75/100

| Dimension | Score | Evidence |
|---|---:|---|
| GBP/entity signals | 21/25 | Exact Place IDs and operational status for all 48 public businesses; compliant Maps media and attribution; hours are incomplete. |
| Reviews and reputation | 16/20 | Source-attributed Google/Yelp/TripAdvisor signals and public methodology; freshness and review recency are not consistently visible. |
| Local on-page SEO | 15/20 | Unique business URLs, visible NAP, city/location context, related listings, bilingual UX; many pages need more owner-verified detail. |
| NAP and citations | 12/15 | 48/48 addresses and phones, 38/48 websites, source links where available; comprehensive cross-platform NAP reconciliation was not available. |
| Local schema | 7/10 | Restaurant, PostalAddress, telephone, URL, cuisine, and breadcrumb graph present; geo, hours, menu, and bakery/cafe subtype precision remain incomplete. |
| Local authority | 4/10 | No comprehensive backlink, local press, chamber, aggregator, or Search Console performance dataset was available in this release. |

Business type: brick-and-mortar multi-entity directory.

Vertical: Colombian restaurants, bakeries, markets, and food-focused cafes.

## Programmatic SEO score: 84/100

| Category | Score | Assessment |
|---|---:|---|
| Data quality | 90 | Exact identity/address matching, cuisine classification, operational status, NAP, reputation fields, and Place IDs are present. |
| Template uniqueness | 70 | Entity data is unique, but many listings have limited narrative differentiation. |
| URL structure | 95 | Stable lowercase slugs, canonical entry URLs, and no primary query-parameter URLs. |
| Internal linking | 85 | Browse hub, related listings, breadcrumbs, and owner/correction paths are present. |
| Thin-content safeguards | 75 | All 48 are discoverable to users; only 19 entry URLs currently pass the content/address sitemap gate. The remaining 29 are `noindex,follow`. |
| Index management | 90 | Self-canonicals, sitemap filtering, noindex for weak pages, and real 404 behavior are implemented. |

## Publication and indexability boundary

- Publication means a record is useful and truthful enough for diners to find
  and compare in the directory.
- Indexability remains stricter. A public entry without sufficient grounded
  narrative content is served with `noindex,follow` and excluded from the
  sitemap until it crosses the content gate.
- Operating status does not override cuisine identity. Cuban, Venezuelan,
  Puerto Rican, and Argentine businesses do not receive Colombian schema or
  public Colombian-directory placement.

## Prioritized actions

1. Obtain owner-verified hours, menu links, signature dishes, and descriptions
   for the 29 currently non-indexable public pages.
2. Revalidate operational status and cuisine classification on a scheduled
   cadence; never equate an Apify/Maps result with final directory eligibility.
3. Render `Bakery` or `CafeOrCoffeeShop` schema where that subtype is more
   accurate than `Restaurant`.
4. Add verified geo coordinates and opening-hours schema without retaining
   restricted Places data beyond permitted use.
5. Display a clear data freshness/as-of signal for reputation summaries.
6. Build crawlable city hubs only when each provides genuinely distinct local
   inventory and guidance; do not create swap-the-city doorway pages.
7. Submit and monitor the live sitemap in Google Search Console and track the
   19 current index candidates separately from the 29 enrichment candidates.
8. Make owner claim outreach data-led: factual corrections, richer listing
   controls, calls/directions/website clicks, and optional services—never paid
   influence over ratings or cuisine eligibility.
9. Reconcile NAP against owner sites, Google, Yelp, TripAdvisor, Apple Business
   Connect, Bing Places, and relevant restaurant platforms as owners engage.
10. Track search-to-listing, listing-to-contact, correction, claim, and upgrade
    events before expanding templates or geography.

## Limitations

This release did not include GBP Insights, Search Console query/index reports,
geo-grid rankings, comprehensive backlinks, review velocity, or complete live
NAP checks across every citation platform. Those datasets are required before
making traffic, ranking, or conversion claims.
