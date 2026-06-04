# Directory Master

**A self-hosted, white-label directory website builder powered by AI.**

Directory Master lets you launch a fully-featured, searchable directory website in minutes. Upload a CSV, let Gemini AI structure your data, and publish a beautiful public directory — all managed through a built-in admin dashboard.

---

## Features

- **Setup Wizard** — guided first-run install; creates your admin account and configures your site
- **AI-Powered CSV Import** — Gemini AI auto-generates summaries, tags, and categories from raw CSV data
- **Public Directory** — homepage, category browse, and individual entry detail pages
- **Admin Dashboard** — manage entries, categories, users, settings, and CSV imports
- **Visual Page Builder** — WYSIWYG drag-and-drop editor for homepage, browse, and entry layouts
- **SEO Manager** — meta titles, descriptions, and Open Graph image fields per page
- **Favicon & Branding** — set a custom browser tab icon from the Settings page
- **XML Sitemap** — auto-generated `/sitemap.xml` ready to submit to Google Search Console
- **Custom Code & Tracking** — inject GTM, Meta Pixel, or any `<script>`/`<style>` into every public page
- **Lead Capture** — "Claim Yours Now" contact form on entry pages; captured leads stored in admin Contacts
- **Role-Based Access** — admin, editor, and viewer roles
- **White-Label Ready** — all branding, colours, fonts, and copy are configurable without touching code

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL 16 + Drizzle ORM |
| AI | Google Gemini (via API) |
| Monorepo | pnpm workspaces + TypeScript 5.9 |

---

## Quick Start on Replit

See **[INSTALL.md](./INSTALL.md)** for the complete step-by-step guide.

The short version:
1. Fork / import this repo into Replit
2. Add a PostgreSQL database (Tools → Database)
3. Set `SESSION_SECRET` in Secrets
4. Run `bash scripts/setup.sh` in the Shell
5. Click **Run** and open your app → complete the setup wizard at `/setup`

---

## Project Structure

```
├── artifacts/
│   ├── directory-master/   # React + Vite frontend
│   └── api-server/         # Express 5 API server
├── lib/
│   ├── db/                 # Drizzle ORM schema + migrations
│   ├── api-spec/           # OpenAPI spec (source of truth for API contracts)
│   └── api-client-react/   # Generated React Query hooks + Zod schemas
├── scripts/
│   ├── setup.sh            # First-run setup script
│   └── post-merge.sh       # Runs automatically after agent task merges
├── .env.example            # Environment variable reference
├── INSTALL.md              # Detailed setup guide
└── CHANGELOG.md            # Full version history
```

---

## License

MIT — free to use, modify, and distribute.
