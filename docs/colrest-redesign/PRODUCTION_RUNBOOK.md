# Colombian Restaurant Directory production runbook

## Authority and deployed release

- Product source authority: this repository and its reviewed Git history.
- Deployed static application source: `9119e4c` (`integrate Colombian restaurant
  brand system`), including the `44410f6` Place Photo and `d7823f5` redesign
  foundations. The API bundle remains byte-identical to `44410f6`.
- Google Place Photos are live for 48 cuisine-qualified published businesses through a production-IP- and Places-API-restricted runtime key. Public responses are `no-store` and display Google Maps plus photographer attribution; owner-supplied media retains precedence.
- Production origin: `https://colombianrestaurantnear.me`.
- Production host: `104.236.237.145`.
- PM2 service: `dirmaster-colrest`, port `3011`.
- Immutable branded release: `/opt/dirmaster/releases/colrest-9119e4c`.
- API runtime path: `/opt/dirmaster/artifacts/api-server/dist/index.mjs` (verified byte-identical to the release).
- Static runtime path: `/opt/dirmaster/static-builds/colrest/public` (symlink to
  `/opt/dirmaster/releases/colrest-9119e4c/public`).
- Pre-redesign recovery set: `/opt/dirmaster/backups/colrest-20260718-d7823f5-pre-redesign-retry1`.

The dirty source checkout at `/opt/dirmaster` is preserved. Deployment uses versioned release artifacts and does not reset, pull over, or commit that unfinished host work.

## Release integrity

The local release archive is ignored from Git and preserved at:

`E:/Users/USUARIO/Downloads/directory-master/.local-dev/colrest-release-d7823f5-retry1.tar.gz`

- Archive SHA-256: `ddeb2325ae42e8d8bbf22a50fe64d348660456e8ba93f8f895150910b3e37d93`
- Archive bytes: `3,861,397`
- Manifest payload files: `106`
- Remote manifest: `/opt/dirmaster/releases/colrest-d7823f5/MANIFEST.sha256`

Before serving traffic, all manifest entries passed `sha256sum -c`, the Node bundle passed `node --check`, and an isolated candidate on port `3012` passed the production-data smoke suite.

## Backup and rollback

The recovery set is mode `0700`; its files are mode `0600`. `SHA256SUMS` verifies:

- `api-dist-before.tar.gz`
- `static-before.tar.gz`
- `database-before.dump`
- `pm2-dump-before.json`

The former API directory is also preserved at:

`/opt/dirmaster/backups/colrest-20260718-d7823f5-pre-redesign-retry1/api-dist-before-directory`

The first backup attempt created `/opt/dirmaster/backups/colrest-20260718-d7823f5-pre-redesign` with only an empty database placeholder before aborting safely on connection parsing. It was preserved for auditability and is not a recovery set. Only the checksummed `retry1` directory is authoritative for this release.

The API served immediately before the portable-worker correction has an additional recovery set at `/opt/dirmaster/backups/colrest-20260718-e988838-preportable`. Its checksummed API archive and PM2 dump allow rollback of that final, API-only cutover without touching the database.

The API served immediately before the canonical-host correction is separately preserved at `/opt/dirmaster/backups/colrest-20260718-f267457-precanonical` with a checksummed API archive and PM2 dump.

Rollback procedure (run on the production host):

1. Resolve the current `dirmaster-colrest` PID and read `DATABASE_URL` from `/proc/<pid>/environ` into the shell without printing it.
2. Confirm `/opt/dirmaster/backups/colrest-20260718-d7823f5-pre-redesign-retry1/api-dist-before-directory` exists and the current active API directory matches the deployed release.
3. Move the current active API directory to a new, explicit quarantine path inside the recovery set, then move `api-dist-before-directory` back to `/opt/dirmaster/artifacts/api-server/dist`. Do not remove either tree.
4. Repoint the exact static symlink `/opt/dirmaster/static-builds/colrest/public` to `/opt/dirmaster/releases/colrest-f267457/public`. If that immutable release is unavailable, extract `static-before.tar.gz` into a new recovery directory and point the symlink there.
5. Export `PORT=3011`, `NODE_ENV=production`, `STATIC_DIR=/opt/dirmaster/static-builds/colrest/public`, `PUBLIC_ORIGIN=https://colombianrestaurantnear.me`, and `ALLOWED_ORIGINS=https://colombianrestaurantnear.me` while preserving the recovered `DATABASE_URL`.
6. Run `pm2 restart dirmaster-colrest --update-env`, verify `/api/healthz`, `/`, `/browse`, one listing, `robots.txt`, and `sitemap.xml`, then run `pm2 save`.
7. Restore `database-before.dump` only if a database rollback is actually required; inspect it first with `pg_restore --list` and choose an explicit target database.

Do not run broad recursive removal commands, reset the host checkout, or print process secrets.

## Redesign deployment proof captured on 2026-07-18

- The production database, prior API, prior static build, and PM2 dump are preserved in the checksummed `retry1` recovery set with directory mode `0700` and file mode `0600`.
- The additive contacts migration added nullable `subject` and `message` fields; the directory retained `61` total entries and `31` published entries.
- An isolated production-data candidate on port `3012` passed health, SSR, all public routes, 26 sitemap URLs, 31 browse cards, bilingual UI, mobile overflow, consent gating, public-field privacy, and serious/critical WCAG smoke checks.
- The corrections endpoint stored a synthetic proof request, its exact database row was verified, and that row alone was removed immediately. No synthetic contact remains.
- The live apex returns `200`, the seven trust/legal routes return `200`, the canonical `www` redirect remains `308` with path and query preserved, and the public API exposes no `_ownerId` field.
- The live API directory is byte-identical to the immutable release, the static symlink resolves to the release, PM2 is online with no post-cutover restart loop, and the release manifest passes.
- Recovery rehearsal proof is preserved at `/opt/dirmaster/recovery-proofs/colrest-d7823f5-redesign`; it extracted both prior artifact archives and validated the PostgreSQL dump catalog without changing production.

## Foundation deployment proof captured on 2026-07-18

- Additive owner/claim migration completed against the backed-up production database.
- Production retained `61` entries; no owner, claim, or audit records were fabricated.
- Candidate smoke: health, SSR home/browse/listing, canonical URLs, JSON-LD, security headers, robots, `19` sitemap URLs, real 404/noindex, and sanitized public API all passed.
- Public smoke: health/home/browse/robots/sitemap/public API returned `200`; synthetic missing route returned `404`; generated editorial hero returned `200`.
- Browser smoke passed at `1440x960` and `390x844` for home, browse, listing, and owner login, with no horizontal overflow, no serious/critical axe violations, no runtime errors, and a working Spanish toggle.
- Recovery rehearsal extracted both backups into an isolated proof directory and validated the database dump catalog without changing production.
- The live API bundle matched the immutable release byte-for-byte, the static symlink matched the release, PM2 was online, and local health returned `200`.
- A development-mode candidate exercised the bundled `pino-pretty` worker on Linux with zero restarts, proving that worker resolution is relative to the runtime bundle rather than the Windows build machine.
- A fresh-clone audit found and repaired stale tracked TypeScript state and generated-output drift. Build state and generated distributions are now ignored, library declarations are force-regenerated, and source is the Git authority.
- The public `www.colombianrestaurantnear.me` host returns a permanent `308` to the canonical apex while preserving the path and query string; the apex continues to serve `200`.

## Intentional remaining controls

- Listing-media source commit `44410f6` is pushed, live, and preserved at
  immutable release `/opt/dirmaster/releases/colrest-44410f6`. Google project
  `sblo-analytics-api` has active Free Trial billing through 2026-10-18. Monitor
  Places usage and configure billing alerts in the Google console; trial credit
  is not evidence of a permanent zero-cost service.
- The legacy Google Maps key exposed by the failed first candidate-launch
  wrapper was removed locally and never promoted. Revoke it in its original
  Google project; the QGS service account does not have authority there.

- The publication queue at `queue.colombianrestaurantnear.me` remains authenticated and separate from the public directory. Its scraped research is not a publication-rights grant.
- Venue images may be published only when owner-supplied or otherwise explicitly licensed. The public directory currently uses the generated editorial hero and owner-controlled listing media.
- Rotate the legacy GitHub personal access token that was previously embedded in a local remote URL. It was removed locally, but provider-side revocation requires account authority.
- Upstream repository write access is not available to the authenticated GitHub identity. The verified branch is therefore pushed to the QGS fork and proposed through an upstream pull request.

## Sanitizer-only API promotion proof captured on 2026-07-18

- The live API was promoted to the `44410f6` bundle without a Google key so
  unclaimed public entry JSON no longer exposes direct queue research-photo
  URLs. The Place Photo endpoint fails closed with no-store `503`; no visual
  photo feature is represented as live.
- The frontend symlink remains exactly
  `/opt/dirmaster/releases/colrest-d7823f5/public`. Live durable smoke passed
  health, robots, sitemap, nine public routes, 31 listings, privacy filtering,
  disabled-photo behavior, consent withdrawal, bilingual UI, mobile overflow,
  and serious/critical WCAG checks.
- The checksummed pre-photo recovery set passed again. Non-mutating recovery
  proof `/opt/dirmaster/recovery-proofs/colrest-44410f6-pre-photo` extracted 10
  prior API files and 95 prior static files and validated the PostgreSQL dump
  catalog. The live sanitizer bundle is byte-identical to the immutable
  `44410f6` API payload.

## Place Photo visual promotion proof captured on 2026-07-19

- Google Cloud Billing API read-back confirmed project `sblo-analytics-api`
  linked to billing account `0110FA-43D98D-4BFDA4`; the console showed the
  $300 Free Trial credit with 90 days remaining and end date 2026-10-18.
- The isolated candidate resolved 31/31 published listings with HTTPS media,
  Google Maps source links, reporting links, and non-empty photographer
  attribution arrays. Every API response remained `private, no-store`.
- Real desktop and mobile browser checks proved venue images and visible source
  attribution, 31 cards, nine public/trust routes, no horizontal overflow, no
  browser errors, and no serious/critical WCAG findings.
- Fresh pre-cutover recovery set
  `/opt/dirmaster/backups/colrest-20260719-44410f6-pre-visual-promotion`
  checksums the prior API, static target, PostgreSQL dump, and PM2 state.
- The static symlink now resolves to the immutable `44410f6` release, its
  manifest passes, the restricted key is present in runtime without appearing
  in source or documentation, and PM2 is online with zero unstable restarts.
- Non-mutating recovery proof
  `/opt/dirmaster/recovery-proofs/colrest-20260719-44410f6-visual-promotion`
  reverified checksums, extracted 10 API and 95 static files, and validated the
  137-line PostgreSQL restore catalog.

## Cuisine-scoped publication reconciliation on 2026-07-19

- Exact Google Places name/address matching confirmed all 61 researched records
  as `OPERATIONAL` and retained a Place ID for every record.
- Cuisine identity is an independent hard gate. The public directory now serves
  48 Colombian restaurants, bakeries, and food-focused cafes. Thirteen verified
  but non-Colombian businesses remain preserved and unpublished: seven
  Venezuelan, four Cuban, one Puerto Rican, and one Argentine.
- Migration `0002_verified_publication_scope.sql` requires 61 exact database
  ID/title matches and fails closed unless the final state is exactly 61 total,
  48 published, 61 Place IDs, and 13 explicit cuisine exclusions.
- Checksummed pre-change recovery set
  `/opt/dirmaster/backups/colrest-20260719-publication-scope-pre48` contains the
  database dump, PM2 state, and prior `61|31|31` entry-state proof. Its checksum
  verification and PostgreSQL catalog validation passed before migration.
- The transaction rehearsal updated all 61 rows and rolled back, leaving the
  prior counts unchanged. The guarded apply then committed `61|48|61|13`.
- Live public API read-back returned 48 listings and leaked no private
  cuisine-decision fields. All 48 photo endpoints returned HTTPS media, Google
  Maps source URLs, non-empty photographer attribution, and `no-store` cache
  controls. Mobile and desktop smoke passed 48 cards, bilingual behavior,
  consent controls, no horizontal overflow, and no serious/critical WCAG
  findings.

## Owner-supplied brand-system promotion on 2026-07-19

- Owner-supplied logo masters are preserved unchanged under
  `docs/colrest-redesign/brand/source/`. Web derivatives use transparent,
  tightly cropped light/dark wordmarks, stacked light/dark primary marks,
  square mobile avatar, favicon/app sizes, manifest, and social avatar.
- Desktop navigation switches between the approved light and dark horizontal
  lockups. Mobile uses the square avatar to preserve controls and touch targets.
  The footer switches between the owner-supplied stacked light and dark primary
  marks.
- Local production build, full workspace typecheck, metadata assertions, asset
  loading, and light/dark desktop/mobile browser checks passed with no
  horizontal overflow. The live domain passed the same four visual states plus
  the existing nine-route, 48-listing, bilingual mobile/WCAG smoke suite.
- Static/API release archive SHA-256 is
  `829c3232b2c560284e9095882f47aaa192b224f3013b6fe85f71e9cdc2811b28`
  for 5,554,840 bytes. The API bundle is byte-identical to the prior live API;
  no database, Places key, or publication-state mutation occurred.
- The isolated port-3012 candidate passed after a slower cold start. The first
  promotion script stopped before backup or symlink mutation while it waited;
  live production remained unchanged. Candidate health and exact assets were
  then read back before the guarded static-only promotion.
- Checksummed backup
  `/opt/dirmaster/backups/colrest-20260719-9119e4c-pre-brand` preserves the
  previous static bundle, PM2 state, and old symlink target. Recovery proof
  `/opt/dirmaster/recovery-proofs/colrest-20260719-9119e4c-brand` preserves the
  backup checksums, before/after targets, archive digest, and non-empty static
  restore catalog.

### Stacked dark-primary follow-up

- Owner supplied the missing stacked dark primary master later on 2026-07-19.
  Source commit `ca2e3c2` preserves the master, adds the transparent production
  derivative, and switches only the dark footer from the temporary horizontal
  lockup to the matching stacked lockup.
- Immutable static release `/opt/dirmaster/releases/colrest-ca2e3c2/public` is
  live. Archive SHA-256 is
  `debc4873af2351297f285e8f23e4c91ab8a67a2acaa7cd2d62709b6e17c4378d`
  for 5,868,068 bytes. The API bundle remains byte-identical to production;
  no database, secret, Google Places, or publication-state change occurred.
- The isolated candidate, exact dark-logo hash, release manifest, live
  desktop/mobile light/dark browser states, nine-route/48-listing bilingual
  WCAG smoke, and production health all passed.
- Checksummed pre-cutover backup
  `/opt/dirmaster/backups/colrest-20260719-ca2e3c2-pre-dark-primary` preserves
  release `9119e4c`. Recovery proof
  `/opt/dirmaster/recovery-proofs/colrest-20260719-ca2e3c2-dark-primary`
  records before/after targets, archive and asset hashes, backup checksums, and
  a non-empty restore catalog.

### Rounded favicon follow-up

- The owner's rounded favicon artwork remains unchanged, while the opaque
  outer square canvas has been removed from all favicon, PWA, and Apple-touch
  derivatives. The resulting RGBA assets render the intended rounded tile on
  browser surfaces instead of an obsolete sharp white square.
- Source commit `9451dab` is live as immutable static release
  `/opt/dirmaster/releases/colrest-9451dab/public`. Archive SHA-256 is
  `a5d2426f50d039a9082f7cd8a18e9465cc7c4a74c13fcd5b59a54ddaf97eab03`
  for 5,899,455 bytes. Live readback proved RGBA mode, exact dimensions, and a
  fully transparent corner for all four icon sizes; brand-state and full
  production smoke suites also passed.
- Checksummed pre-cutover backup
  `/opt/dirmaster/backups/colrest-20260719-9451dab-pre-rounded-favicon` and
  recovery proof
  `/opt/dirmaster/recovery-proofs/colrest-20260719-9451dab-rounded-favicon`
  preserve release `ca2e3c2`, exact targets and hashes, and a non-empty restore
  catalog. The API remains byte-identical and no data or secret changed.
