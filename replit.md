# Workspace

**Current version: 3.4.0** — See `CHANGELOG.md` for the full release history and developer notes.

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Gemini AI (via Replit AI Integrations) for CSV data structuring
- **Auth**: Session-based (in-memory sessions + Bearer tokens)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Directory Master (`/`)
A self-hosted, white-label directory website builder. Users install it via a setup wizard, upload a CSV, and Gemini AI structures the data into categories, entries, and summaries.

**Key features:**
- Setup wizard (multi-step, first-time install)
- Gemini-powered CSV import with progress tracking
- Public directory: homepage, browse/category pages, entry detail pages
- Admin dashboard: manage entries, categories, users, settings, CSV re-import
- Role-based access (admin, editor, viewer)
- Visual page builder (Elementor-like) at `/admin/builder/:page` with WYSIWYG editing, drag-and-drop, and auto-save
- Per-section typography controls: font family, heading/body size, heading color
- Per-section color pickers: background, text, heading, button, overlay
- `templateSettings` JSONB column drives all public page rendering in real time
- **Inline Homepage Template Editor** — admin "Edit Layout" bar on homepage activates full-screen split editor with left Add Section panel, sortable section list (drag/reorder), inline section edit dialogs, and global save
- **Inline Entry Template Editor** — "Edit Layout" button on entry pages; drag-and-drop section reorder, eye-toggle, sidebar field row reordering via grip handles

**Pages:**
- `/` — Public homepage (or setup wizard redirect if not installed)
- `/setup` — Installation wizard
- `/browse` — Category browse page
- `/entry/:id` — Individual entry detail
- `/admin` — Admin dashboard
- `/admin/login` — Admin login
- `/admin/entries` — Manage entries
- `/admin/categories` — Manage categories
- `/admin/import` — CSV import with Gemini
- `/admin/settings` — Directory settings (includes Visual Page Builder launch cards)
- `/admin/users` — User management
- `/admin/builder/:page` — Visual page builder (page = `homepage` | `browse` | `entry`); full-screen, no AdminLayout

## DB Schema

- `directory_settings` — Site title, logo, homepage content, theme, installed flag
- `users` — Admin/editor/viewer accounts with hashed passwords
- `categories` — Directory categories with slugs
- `entries` — Directory entries: title, summary, description, contact info, location, venue, eventType, startDate, endDate, tags, moreDetails, customFields (jsonb)
- `import_jobs` — CSV import job tracking

## API Routes

All routes under `/api`:
- `GET /setup/status` — Check if app is installed
- `POST /setup/complete` — Complete initial setup
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST /entries`, `GET/PATCH/DELETE /entries/:id`, `PATCH /entries/:id/publish`, `PATCH /entries/:id/featured`
- `GET/POST /categories`, `PATCH/DELETE /categories/:id`
- `GET/PATCH /settings`
- `GET/POST /users`, `PATCH/DELETE /users/:id`
- `POST /import/analyze` — Analyze CSV headers, return heuristic field mapping suggestions
- `POST /import/csv` — Start import with confirmed `fieldMappings[]` array
- `GET /import/status/:jobId` — Poll import job progress
- `GET /public/entries`, `GET /public/entries/:id`, `GET /public/stats`
- `GET /public/featured`, `GET /public/recent`, `GET /public/settings`

## Import System

3-step wizard at `/admin/import`:
1. **Upload** — Upload or paste a CSV file
2. **Map Columns** — Review heuristic-suggested field mappings; toggle columns on/off; change mappings via dropdown; confidence indicators (high/medium/low)
3. **Progress** — Background job processes rows, optionally calling Gemini for missing summaries/tags

Key design notes:
- Heuristic mapping uses regex patterns against column names (no AI needed for mapping)
- Gemini enrichment only runs when `summary` or `tags` columns aren't mapped (batches of 20)
- Location subfields (`location_city`, `location_state`, `location_country`) are auto-combined into the `location` field
- At least one column must map to `title` for import to proceed
