# Colombian Restaurant Directory production runbook

## Authority and deployed release

- Product source authority: this repository and its reviewed Git history.
- Deployed application commit: `cd00345` (`make production API release self-contained`).
- Production origin: `https://colombianrestaurantnear.me`.
- Production host: `104.236.237.145`.
- PM2 service: `dirmaster-colrest`, port `3011`.
- Immutable release: `/opt/dirmaster/releases/colrest-cd00345`.
- API runtime path: `/opt/dirmaster/artifacts/api-server/dist/index.mjs` (verified byte-identical to the release).
- Static runtime path: `/opt/dirmaster/static-builds/colrest/public` (symlink to the release's `public` directory).
- Pre-deploy recovery set: `/opt/dirmaster/backups/colrest-20260718-04d432b`.

The dirty source checkout at `/opt/dirmaster` is preserved. Deployment uses versioned release artifacts and does not reset, pull over, or commit that unfinished host work.

## Release integrity

The local release archive is ignored from Git and preserved at:

`E:/Users/USUARIO/Downloads/directory-master/.local-dev/colrest-release-cd00345.tar.gz`

- Archive SHA-256: `753b7bf885d159cc40117a6637c2e17b8fee04be7b88ff8a292dbc69c45f9598`
- Archive bytes: `3,836,481`
- Manifest payload files: `102`
- Remote manifest: `/opt/dirmaster/releases/colrest-cd00345/MANIFEST.sha256`

Before serving traffic, all manifest entries passed `sha256sum -c`, the Node bundle passed `node --check`, and an isolated candidate on port `3012` passed the production-data smoke suite.

## Backup and rollback

The recovery set is mode `0700`; its files are mode `0600`. `SHA256SUMS` verifies:

- `api-dist-before.tar.gz`
- `static-before.tar.gz`
- `database-before.dump`
- `pm2-dump-before.json`

The former static directory is also preserved at:

`/opt/dirmaster/backups/colrest-20260718-04d432b/public-before-directory`

Rollback procedure (run on the production host):

1. Resolve the current `dirmaster-colrest` PID and read `DATABASE_URL` from `/proc/<pid>/environ` into the shell without printing it.
2. Extract `api-dist-before.tar.gz` into `/opt/dirmaster/artifacts/api-server`.
3. Remove only the exact static symlink `/opt/dirmaster/static-builds/colrest/public` after confirming it is a symlink to the deployed release.
4. Move `public-before-directory` back to `/opt/dirmaster/static-builds/colrest/public`.
5. Export `PORT=3011`, `NODE_ENV=production`, `STATIC_DIR=/opt/dirmaster/static-builds/colrest/public`, `PUBLIC_ORIGIN=https://colombianrestaurantnear.me`, and `ALLOWED_ORIGINS=https://colombianrestaurantnear.me` while preserving the recovered `DATABASE_URL`.
6. Run `pm2 restart dirmaster-colrest --update-env`, verify `/api/healthz`, `/`, `/browse`, one listing, `robots.txt`, and `sitemap.xml`, then run `pm2 save`.
7. Restore `database-before.dump` only if a database rollback is actually required; inspect it first with `pg_restore --list` and choose an explicit target database.

Do not run broad recursive removal commands, reset the host checkout, or print process secrets.

## Deployment proof captured on 2026-07-18

- Additive owner/claim migration completed against the backed-up production database.
- Production retained `61` entries; no owner, claim, or audit records were fabricated.
- Candidate smoke: health, SSR home/browse/listing, canonical URLs, JSON-LD, security headers, robots, `19` sitemap URLs, real 404/noindex, and sanitized public API all passed.
- Public smoke: health/home/browse/robots/sitemap/public API returned `200`; synthetic missing route returned `404`; generated editorial hero returned `200`.
- Browser smoke passed at `1440x960` and `390x844` for home, browse, listing, and owner login, with no horizontal overflow, no serious/critical axe violations, no runtime errors, and a working Spanish toggle.
- Recovery rehearsal extracted both backups into an isolated proof directory and validated the database dump catalog without changing production.
- The live API bundle matched the immutable release byte-for-byte, the static symlink matched the release, PM2 was online, and local health returned `200`.

## Intentional remaining controls

- The publication queue at `queue.colombianrestaurantnear.me` remains authenticated and separate from the public directory. Its scraped research is not a publication-rights grant.
- Venue images may be published only when owner-supplied or otherwise explicitly licensed. The public directory currently uses the generated editorial hero and owner-controlled listing media.
- Rotate the legacy GitHub personal access token that was previously embedded in a local remote URL. It was removed locally, but provider-side revocation requires account authority.
- Upstream repository write access is not available to the authenticated GitHub identity. The verified branch is therefore pushed to the QGS fork and proposed through an upstream pull request.

