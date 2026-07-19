# Colombian Restaurant Near Me production design record

**Decision date:** 2026-07-18

**Scope:** public discovery, restaurant detail, trust/legal surfaces, correction intake, and owner conversion

**Status:** production candidate; promotion requires the runbook gates

This record supersedes the local-only presentation and unclaimed menu-line treatment in `DESIGN_SPEC.md`. The original document remains preserved as design history.

## Product decisions

- The directory serves diners first. Search, city discovery, useful listing details, contact actions, directions, and correction paths precede owner conversion.
- Every published restaurant receives a full responsive card. Claimed status changes trust and editing rights; it does not make unclaimed restaurants deliberately hard to discover.
- Unclaimed restaurants use a branded abstract image treatment. Restaurant photography is shown only when it is owner-controlled or otherwise licensed; no synthetic image is presented as a real venue.
- The homepage is an editorial discovery experience, not a Miami-only landing page. South Florida is stated as the current coverage boundary, not the permanent product identity.
- Motion is limited to two opposing discovery rails. It pauses for hover/focus, becomes manual scrolling on small screens, and is disabled for reduced-motion users.
- Ratings remain source-attributed and the methodology is public. The interface does not imply a proprietary customer-review system.
- Owner claim and upgrade paths remain prominent but follow the consumer experience. Verified badges represent completed directory ownership review, not an endorsement of food quality.

## Trust and legal baseline

Public routes now cover About, Rating Methodology, Corrections and Takedowns, Privacy, Terms, Owner Terms, and Accessibility. The corrections form writes to the shared operations inbox with rate limiting, a honeypot, validation, request type, page URL, and message context.

Optional analytics scripts do not load until affirmative consent is stored. Essential-only operation remains available, and cookie preferences can be reopened from the footer. This is a practical launch baseline, not a substitute for jurisdiction-specific legal review.

## Release gates

Promotion requires:

1. Generated API clients are current and the monorepo typecheck passes.
2. API and theme-specific frontend production builds pass.
3. Desktop and mobile smoke checks cover home, browse, one listing, trust/legal routes, bilingual UI, overflow, runtime errors, and serious/critical accessibility findings.
4. The production database and currently served artifacts have checksummed backups before migration or cutover.
5. The candidate runs from an immutable commit-addressed release and passes the production-data smoke suite on an isolated port.
6. Production health, SSR, sitemap, public API privacy, consent behavior, and recovery extraction are proved after cutover.

Run the durable browser proof with:

```powershell
$env:COLREST_BASE_URL = "https://colombianrestaurantnear.me"
node scripts/colrest-production-smoke.mjs
```
