# Threat Model

## Project Overview

Directory Master is a self-hosted directory website builder in a pnpm workspace monorepo. A React/Vite frontend serves public directory pages and an admin UI, while an Express 5 API server backed by PostgreSQL/Drizzle handles setup, authentication, content management, settings, user management, and CSV imports with optional Gemini AI enrichment.

Production scope for this scan is the `artifacts/api-server` API, the `artifacts/directory-master` frontend, and shared libraries in `lib/` that those artifacts execute. `artifacts/mockup-sandbox` is treated as dev-only unless production reachability is demonstrated.

Assumptions propagated for future scans:
- Production traffic is TLS-terminated by the platform.
- `NODE_ENV` is `production` in deployed environments.
- Mockup sandbox is not deployed to production.

## Assets

- **Administrator, editor, and viewer accounts** — user identities, password hashes, roles, and long-lived sessions. Compromise allows site takeover or unauthorized content changes.
- **Published and unpublished directory content** — entries, categories, settings, and import job state. Unauthorized modification impacts site integrity; unauthorized disclosure may expose unpublished business data.
- **Contact / claim-form submissions** — visitor-provided names, phone numbers, and email addresses stored for follow-up. Unauthorized access exposes PII and unauthorized deletion destroys business leads.
- **Bootstrap ownership of a fresh deployment** — the first administrator account and installation state. Losing control of first-run setup gives an attacker permanent administrative access.
- **Application secrets and database access** — `DATABASE_URL`, Gemini credentials, and any other environment-backed secrets. Compromise enables direct data access or abuse of third-party services.
- **Imported CSV data and AI-enriched content** — potentially sensitive business data uploaded by admins and then stored or shown publicly.

## Trust Boundaries

- **Browser to API** — all client input is untrusted, including setup data, login credentials, admin mutations, search/filter params, and uploaded CSV content.
- **Public to authenticated/admin** — public directory endpoints are intentionally unauthenticated, while admin APIs must enforce authentication and role checks server-side.
- **Fresh-install unauthenticated bootstrap to installed system** — `/api/setup/*` crosses a special boundary where an unauthenticated caller can initialize the deployment before `installed=true` is set.
- **API to PostgreSQL** — the API has broad database access; injection or mass-assignment flaws here can directly alter protected data.
- **API to Gemini integration** — import jobs send selected CSV-derived content to Gemini. This boundary must prevent unnecessary data exposure and availability abuse.
- **API to object storage** — storage routes mint upload URLs and stream stored objects back through the app origin. Missing auth or ACL enforcement here can expose private files or create same-origin file-hosting primitives.
- **Frontend runtime to browser storage** — bearer tokens are stored in `localStorage`, so any same-origin script execution would expose active admin/editor sessions.
- **Production to dev-only surfaces** — `artifacts/mockup-sandbox` is out of production scope unless routing/build config proves otherwise.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/**/*.ts`, `artifacts/directory-master/src/App.tsx`.
- **Highest-risk code areas:** `src/routes/setup.ts`, `src/routes/auth.ts`, `src/middlewares/auth.ts`, `src/lib/auth.ts`, `src/routes/usersRoute.ts`, `src/routes/importRoute.ts`, `src/routes/contactsRoute.ts`, `src/routes/storage.ts`, `src/lib/objectStorage.ts`, frontend auth/storage code in `src/hooks/use-auth.tsx`.
- **Public surfaces:** `/api/setup/status`, `/api/setup/complete`, `/api/auth/login`, `/api/public/*`, public frontend pages `/`, `/browse`, `/entry/:id`, `/setup`, `/admin/login`.
- **Authenticated/admin surfaces:** `/api/entries*`, `/api/categories*`, `/api/settings*`, `/api/users*`, `/api/import*`, `/api/contacts*`, and `/api/auth/me`/`logout`.
- **Usually dev-only / ignore unless reachable:** `artifacts/mockup-sandbox/**`.

## Threat Categories

### Spoofing

The application issues bearer session tokens from `/api/auth/login` and accepts them on privileged API routes. The API must validate every protected request server-side, tokens must be unpredictable and revocable, and bootstrap/setup flows must not let an arbitrary unauthenticated internet user claim ownership of a production deployment beyond the intended first-run window.

### Tampering

Editors and admins can create and modify entries, categories, settings, users, and import data. The server must validate and constrain request bodies instead of trusting arbitrary JSON fields, and setup/import flows must prevent unauthorized or unsafe state transitions that let attackers rewrite protected configuration or content.

### Information Disclosure

The public API intentionally exposes published entries and public-facing settings, but it must not leak unpublished content, contact submissions, user records, secrets, password material, or active session tokens. Logs and error responses must avoid secrets and internal details, only the minimum CSV-derived content needed for enrichment should cross to Gemini, and private object-storage paths must not become publicly readable just because they are served through application routes.

### Denial of Service

Public and privileged endpoints accept potentially expensive inputs such as login attempts, setup submissions, search params, and large CSV payloads. Production code must bound request sizes, avoid unbounded work triggered by unauthenticated callers, and ensure import or AI-enrichment paths cannot be abused to exhaust server, database, or third-party quota.

### Elevation of Privilege

The main privilege boundaries are unauthenticated → authenticated, viewer → editor, and editor → admin. All state-changing and sensitive read routes must enforce role checks on the server, first-run setup must not become an account-takeover vector, storage routes must not let unauthenticated users host active content under the application origin, and any injection, object/property abuse, or browser-side script execution that could steal bearer tokens or mutate admin state would be high impact.