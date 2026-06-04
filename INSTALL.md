# Directory Master — Installation Guide

This guide walks you through cloning Directory Master from GitHub into Replit and getting a fully working application running in under 10 minutes.

---

## Prerequisites

- A free [Replit](https://replit.com) account
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key *(optional — only needed for AI-powered CSV import)*

---

## Step 1 — Import from GitHub into Replit

1. Log into [replit.com](https://replit.com)
2. Click **+ Create Repl**
3. Choose the **Import from GitHub** tab
4. Paste the GitHub repository URL and click **Import**
5. Replit will clone the repository and detect the environment automatically

> Replit reads the `.replit` file in the root, which declares Node.js 24 and PostgreSQL 16 as required modules. These are provisioned automatically.

---

## Step 2 — Add a PostgreSQL Database

1. In your Replit workspace, open **Tools → Database** (left sidebar)
2. Click **Create a database** → choose **PostgreSQL**
3. Replit creates the database and automatically sets the `DATABASE_URL` secret

> If you already have an external PostgreSQL database, skip this step and manually set `DATABASE_URL` in Secrets (Step 3).

---

## Step 3 — Configure Secrets

Open **Tools → Secrets** and add the following:

### Required

| Secret Name | Value | Notes |
|---|---|---|
| `SESSION_SECRET` | A long random string | Generate with the command below |
| `DATABASE_URL` | PostgreSQL connection string | Set automatically in Step 2 if you used Replit DB |

**Generate a SESSION_SECRET** — open the Shell and run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as the value for `SESSION_SECRET`.

### Optional

| Secret Name | Notes |
|---|---|
| `GEMINI_API_KEY` | Enables AI-powered CSV import (auto-generates summaries and tags). Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey). |

> Object storage secrets (`DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`) are provisioned automatically if you enable App Storage in Replit. Leave them blank otherwise.

See `.env.example` for a full reference of every variable.

---

## Step 4 — Run the Setup Script

Open the **Shell** tab and run:

```bash
bash scripts/setup.sh
```

This script:
- Installs all pnpm workspace dependencies
- Pushes the Drizzle ORM schema to your database (creates all tables)
- Confirms everything is ready to start

> You only need to run this once. On subsequent agent task merges, `scripts/post-merge.sh` runs automatically to keep the schema up to date.

---

## Step 5 — Start the Application

Click the **Run** button (▶) at the top of Replit.

This starts three services:
| Service | What it does |
|---|---|
| **API Server** | Express 5 backend on port 8080 |
| **Frontend (web)** | React + Vite app served at `/` |
| **Component Preview** | Internal mockup sandbox (dev only) |

Wait a few seconds for the services to compile and start. You'll see green indicators when they're ready.

---

## Step 6 — Complete the Setup Wizard

1. Open your app in the **Preview** pane (or click **Open in new tab**)
2. You'll be redirected to `/setup` automatically on first run
3. Follow the wizard:
   - **Site Info** — enter your directory's name and description
   - **Admin Account** — create your username and password
   - **Finish** — your directory is live!

> After setup, the root URL (`/`) shows your public directory homepage. The admin dashboard is at `/admin`.

---

## Step 7 — Import Your Data (Optional)

1. Log into the admin dashboard at `/admin`
2. Go to **Import CSV**
3. Upload a `.csv` file containing your directory entries
4. Map your CSV columns to the appropriate fields
5. Click **Start Import** — if `GEMINI_API_KEY` is set, AI will enrich missing summaries and tags automatically

---

## Directory Structure

```
├── artifacts/
│   ├── directory-master/   # React + Vite frontend (public site + admin UI)
│   │   └── src/
│   │       ├── pages/      # Route-level page components
│   │       └── components/ # Shared UI components
│   └── api-server/         # Express 5 REST API
│       └── src/
│           ├── routes/     # API route handlers
│           ├── middlewares/ # Auth, rate-limit middleware
│           └── lib/        # Shared utilities (auth, logger, Gemini, storage)
├── lib/
│   ├── db/                 # PostgreSQL schema (Drizzle ORM) + migration config
│   ├── api-spec/           # OpenAPI 3.1 spec — single source of truth for API
│   └── api-client-react/   # Generated React Query hooks + Zod schemas
├── scripts/
│   ├── setup.sh            # ← Run this once after cloning
│   └── post-merge.sh       # Runs automatically after agent task merges
├── .env.example            # All supported environment variables with descriptions
├── README.md               # Project overview
├── INSTALL.md              # This file
└── CHANGELOG.md            # Full version history
```

---

## Admin Pages Reference

| URL | Purpose |
|---|---|
| `/admin` | Dashboard — stats overview |
| `/admin/entries` | Manage directory entries |
| `/admin/categories` | Manage categories |
| `/admin/import` | Import entries from CSV |
| `/admin/seo` | SEO Manager (meta tags, OG image) |
| `/admin/contacts` | View lead-capture form submissions |
| `/admin/users` | Manage admin/editor/viewer accounts |
| `/admin/settings` | Site settings, favicon, sitemap, footer, custom scripts |
| `/admin/builder/:page` | Visual page builder (homepage / browse / entry) |

---

## Troubleshooting

### "DATABASE_URL is not set" during setup
Go to **Tools → Database** in Replit and provision a PostgreSQL database. It will set `DATABASE_URL` automatically.

### App redirects to `/setup` even after completing setup
The `installed` flag in the database may not have been set. Re-run the setup wizard or check that the `directory_settings` table has a row with `installed = true`.

### CSV import works but no AI enrichment
Set the `GEMINI_API_KEY` secret. Without it, the import still works but entries won't have auto-generated summaries or tags.

### Schema errors after pulling new changes
Run `pnpm --filter @workspace/db run push` in the Shell to apply any new schema changes.

---

## Updating

When you pull new changes from GitHub:
```bash
bash scripts/setup.sh
```

This re-installs any new dependencies and applies any schema changes. Then click **Run** to restart the services.

---

## Default Credentials

There are no default credentials. The setup wizard creates your first admin account during Step 6. Choose a strong password.

---

## Support

See `CHANGELOG.md` for a full history of changes and developer notes.
