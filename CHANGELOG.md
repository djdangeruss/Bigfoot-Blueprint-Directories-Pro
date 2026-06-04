# Changelog

All notable changes to **Directory Master** are documented in this file.

---

## [3.4.0] — 2026-06-04

Favicon customisation, XML sitemap for SEO, admin branding footer, and object-storage security hardening.

---

### New Features

#### Favicon URL (Site Settings)
- A new **Favicon** card in **Admin → Settings** (above the Footer section) lets admins set a custom browser tab icon via URL.
- Supports `.ico`, `.png`, and `.svg` formats; recommended size 32×32 or 64×64 px.
- A **live image preview** (32×32) appears next to the URL field as you type.
- The favicon is applied globally via a `useEffect` in both the public and admin layouts — takes effect on every page immediately after saving, with no page reload required.
- Stored in the `favicon_url` column of `directory_settings`; exposed through both the admin settings API and the public settings endpoint.

#### XML Sitemap
- A new **`/sitemap.xml`** endpoint is served at the root of the application (outside the `/api` prefix).
- Dynamically generates a standards-compliant XML sitemap containing the **homepage**, **browse page**, and all **published entry pages**, with correct `<lastmod>`, `<changefreq>`, and `<priority>` values.
- Base URL is derived from the real request host, so it resolves correctly in both development and production.
- Cached for 1 hour; auto-updates in real time as entries are published or unpublished.
- A new **XML Sitemap** card in **Admin → Settings** (above the Footer section) displays the full dynamic sitemap URL with a one-click **Copy** button and step-by-step instructions for submitting to Google Search Console.

#### Admin Footer Branding
- A small footer line — *"Bigfoot Blueprint Directories by BanjoSoft LLC | Copyright 2026"* — now appears at the bottom of every admin screen (Dashboard, Entries, Categories, Import CSV, SEO, Contacts, Users, Settings).
- Pinned below the page content with a subtle top border; 11 px, black in light mode / muted gray in dark mode.
- Does **not** appear on any public-facing page.

### Security

#### Object Storage Origin Abuse (Storage Routes)
- **Upload auth** — `POST /storage/uploads/request-url` now requires `requireEditor` middleware; unauthenticated callers can no longer obtain presigned PUT URLs.
- **Private object auth + ACL** — `GET /storage/objects/*path` now requires `requireAuth` and enforces `canAccessObjectEntity` ACL checks, preventing any authenticated user from reading arbitrary private objects by path.
- **Content-Type hardening** — The object download route now forces `Content-Type: application/octet-stream`, `Content-Disposition: attachment`, and `X-Content-Type-Options: nosniff`, closing the same-origin XSS vector that allowed uploaded HTML/SVG/JS to execute in the browser.

---

## [3.3.0] — 2026-06-04

"Claim Yours Now" lead-capture form embedded inside the Entry Details Sidebar, with contacts storage and admin management.

---

### New Features

#### "Claim Yours Now" Sidebar Form (Entry Pages)
- A **"Claim Yours Now"** lead-capture form is now embedded at the bottom of the **Contact & Details** sidebar on every public entry page.
- Visitors fill in **Full Name**, **Phone**, and **Email** and submit directly from the sidebar — no page navigation required.
- On success the form swaps to a configurable **thank-you message**; validation prevents empty submissions.
- The section is **togglable** (eye icon) in the inline Entry Template editor, just like any other section.

#### Claim Form Inline Editor
- In **Edit Layout** mode on entry pages, the sidebar shows the Claim section at the bottom with a **pencil (✏️) icon** that opens an edit dialog.
- Admins can customise the **heading**, **body text**, **button label**, and **thank-you message** without leaving the page.
- Changes are saved along with the rest of the template via the existing **Apply Changes** flow.

#### Contacts Storage & Admin Page
- Submissions are stored in a new **`contacts`** database table (name, phone, email, timestamp, entry association).
- A new **Contacts** admin page (`/admin/contacts`) lists all captured leads with sortable columns and entry links.
- Full API route (`POST /api/contacts`, `GET /api/contacts`) with admin-only auth guard.

### Bug Fixes

- **Dead claim-section code removed** — leftover unreachable `claim` branch inside the edit-mode section renderer was cleaned up, eliminating the source of a transient HMR runtime crash after template saves.

---

## [3.2.0] — 2026-06-03

Configurable Related Entries count in the Entry Template editor.

---

### New Features

#### Related Entries Count Picker (Entry Template Editor)
- The **Related Entries** section in the inline Entry Template editor now shows a **"Show: 1 2 3 4 5 6 entries"** control inside the section block.
- The selected count is highlighted in blue; clicking any number instantly updates the live preview.
- Saving the template persists the chosen count — public entry pages respect the saved value on every visit.
- Grid layout adapts automatically: 1 column for 1 entry, 2 columns for 2, and 3 columns for 3–6.
- Default remains **3** for any template that has not explicitly set a count.

### Bug Fixes

- **Related Entries API limit** — The related-entries query previously fetched only 4 records, capping the visible results at 3 after filtering out the current entry. The limit is now **7** (6 selectable slots + 1 buffer for the current entry), so all 6 slots can be filled when enough entries exist in the category.

---

## [3.1.0] — 2026-06-03

Custom field icon picker for the Entry Template editor.

---

### New Features

#### Per-Field Icon Picker (Entry Template Editor)
- Each custom field row in the **Editing Entry Template** inline editor now has a fourth toolbar button (smiley face icon) for selecting a decorative icon.
- Clicking the icon button opens a full **Icon Picker modal** with:
  - **Search** — filters icons by name in real time
  - **Category filter pills** — Location, Contact, Business, Time, People, Documents, Technology, Nature, Transport, Activities, Misc (or All)
  - **8-column icon grid** — 98 curated Lucide icons shown with name labels; selected icon is highlighted in blue
  - **Remove icon** link in the footer when an icon is already selected
- When active (icon selected), the toolbar button turns purple and displays the chosen icon instead of the placeholder
- All icons are sourced from the existing **Lucide React** library (no external dependencies); 98 icons across 11 categories
- Selected icons are saved in `CustomFieldDisplay.icon` (new optional field in `templateTypes.ts`) and persisted with the entry template on "Apply Changes"
- Icons render on the public entry page **next to the field label** in all three section contexts: Description body, Sidebar, and Title & Summary header

---

## [3.0.0] — 2026-06-03

Homepage inline editor — Call to Action block, plus Text Block color and alignment controls.

---

### New Features

#### Call to Action (CTA) Block
- Added a new **Call to Action** block type (`custom-cta`) to the homepage inline editor's "Add Section" panel.
- Multiple CTA blocks can be added (not a singleton).
- Edit dialog controls:
  - **Button Label** — the button text
  - **Button Link URL** — destination href
  - **Open Link In** — Same Window (`_self`) or New Window (`_blank`); sets `rel="noopener noreferrer"` automatically for new-window links
  - **Text Alignment** — Left / Center / Right icon toggle (applies to heading, body text, and button position)
  - **Button Text Size** — S / M / L / XL selector (maps to `0.875rem` / `1rem` / `1.125rem` / `1.25rem`)
  - **Button Corners** — Rounded (pill) or Square toggle
  - **Colors** panel — Section Background, Button Color, Text Color, each with a native color picker + hex input + Reset link
- Rendered block supports an optional heading (`section.heading`) and optional description (`bodyText`) above the button.
- In edit mode, blocks with no button text yet show a dashed-border placeholder prompt instead of an invisible section.
- Added `buttonTarget` and `buttonRadius` fields to `SectionProps` in `templateTypes.ts`.

#### Text Block Enhancements
- Color pickers (background, heading color, body text color) added to the Edit Text Block dialog.
- Text alignment toggle (Left / Center / Right) added to the Edit Text Block dialog.

---

## [2.9.0] — 2026-06-02

CSV import correctness release — multi-line quoted field parsing fixed end-to-end, inline column label editing, and duplicate-category prevention.

---

### Bug Fixes

#### CSV Multi-Line Quoted Field Parsing (Backend)
- **Root cause**: `importRoute.ts` split the raw CSV file on `\n` before parsing, so any quoted field containing an embedded newline (e.g. a two-line street address) broke row alignment: the second physical line was treated as a brand-new CSV row, shifting every subsequent column position by the number of fields before the newline.
- For a CSV where column 4 is "State" and was mapped to Category, garbled rows produced values like `000,,,Unknown,Not used...` as the "category" — the entire CSV fragment that ended up in that column position.
- **Fix**: replaced the line-splitting approach with a new `parseCSV(content: string): string[][]` function that walks the entire file character-by-character, tracking quote state. Newlines encountered inside a quoted field are kept as part of the field value; only unquoted newlines start a new row.
- `processImport` now calls `parseCSV(csvContent)` → `allRows`, then `headers = allRows[0]` and `dataRows = allRows.slice(1)`. The inner loop iterates `dataRows` directly instead of calling `parseCSVLine` per line.

#### CSV Multi-Line Quoted Field Parsing (Frontend Mapping UI)
- The column mapping step extracted headers and sample values the same broken way: `content.split("\n")` → `parseCSVLine(lines[0])` / `lines.slice(1,4).map(parseCSVLine)`.
- If a multi-line quoted field appeared in the first four rows, column headers and sample values shown in the UI were misaligned, causing the admin to map the wrong columns.
- **Fix**: replaced `parseCSVLine` with a new `parseCSVRows(content: string): string[][]` function using the same character-by-character algorithm. Both `handleNext` (the "Analyze" button handler) and `handleAiMap` ("Map With Gemini") now call `parseCSVRows(content)` and destructure `allRows[0]` / `allRows.slice(1, 4)` directly — no intermediate line array.

#### Duplicate Categories on Import
- If two CSV columns were independently mapped to `category` (e.g. by first selecting one column then mapping another), both columns were processed as categories, resulting in import jobs producing duplicate or conflicting category assignments.
- **Fix**: `updateMapping` in `import.tsx` now enforces a single-category constraint. When the admin selects `category` for a column, any other column that was previously mapped to `category` is automatically reset to `skip` before the new mapping is applied.

---

### New Features

#### Inline Column Label Editing (Import Mapping Step)
- Each row in the Column Mappings table now has a **pencil icon** (Edit2) to the right of the field dropdown.
- Clicking the pencil replaces the dropdown with a plain text input pre-filled with the current custom label (or the column name if no custom label exists).
- Pressing **Enter** or blurring the input commits the value: it is slugified (lowercase, spaces → hyphens) and written back as a `custom_<slug>` target with the typed string as the `customLabel`.
- Pressing **Escape** cancels the edit and restores the dropdown without changing the mapping.
- This allows admins to rename any auto-generated custom field key to something human-readable (e.g. `custom_field-1` → `custom_accepted-insurance`) without opening a separate dialog.
- `editingLabel` state (`columnName | null`) and `editingLabelValue` string are tracked in component state; the pencil and input are conditionally rendered per row.

---

### Developer Notes for v2.9

- **`parseCSV` vs `parseCSVLine`**: The key design difference is scope. `parseCSVLine` operated on a single already-split line and was inherently unable to handle embedded newlines. `parseCSV` / `parseCSVRows` treat the entire file as one token stream — the quote-tracking flag persists across physical line boundaries. Both implementations use the same state machine: `inQuotes` bool, character-by-character loop, `""` escape handling, comma delimiter, newline row separator.
- **Why the garbling was hard to spot**: The misalignment only occurred on rows that had a multi-line quoted field. For a 2,900-row CSV with only a handful of multi-line addresses, the vast majority of rows imported correctly; only those rows produced garbage, and because the shifted columns happened to land on numeric/unknown values, the garbled strings were accepted as valid category names rather than triggering a parse error.
- **Frontend `parseCSVRows` performance note**: The function is called only on user-initiated events (`handleNext`, `handleAiMap`) — not on every render or keystroke. For a ~700 KB CSV this is fine. The row-count display in the "Start Import (N rows)" button still uses a fast `split("\n").length` approximation since it only needs an estimate and runs on every render.
- **Single-category constraint implementation**: `updateMapping` receives `(columnName, value)`. If `value === "category"`, the function first calls `setMappings(prev => prev.map(m => m.columnName !== columnName && m.targetField === "category" ? { ...m, targetField: "skip" } : m))` before applying the new mapping. This is a pure state transform with no extra API call.
- **Pencil edit slug contract**: The slugifier used on the frontend label input mirrors the server-side slugifier: `value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")`. The resulting target field is always stored as `custom_<slug>` to match how `processImport` writes custom fields to the `customFields` JSONB column.

---

## [2.8.0] — 2026-06-02

Large CSV import performance overhaul — 2,900-row imports now complete in ~7 minutes instead of ~45.

---

### Improvements

#### CSV Import — Bulk DB Inserts
- Replaced row-by-row `INSERT` statements with chunked bulk inserts of 250 rows per query.
- Inserting 2,900 entries now takes ~5 seconds instead of several minutes.
- Progress updates fire after each chunk rather than every 10 rows, giving smoother feedback.

#### CSV Import — Parallel Gemini Enrichment
- Gemini enrichment now runs 3 batches concurrently (`Promise.allSettled`) instead of sequentially.
- Batch size increased from 20 entries per Gemini call to 50.
- Combined effect: enrichment for 2,900 rows drops from ~41 minutes to ~6 minutes.
- Individual batch failures still don't abort the import — failed batches are logged and the import continues without summaries for that slice.

#### CSV Import — Bulk Category Upsert
- Category creation replaced the old N-individual-SELECT + N-individual-INSERT loop with a single `SELECT` (using `inArray`) to find existing categories, followed by one bulk `INSERT ... ON CONFLICT DO NOTHING` for all new ones.
- Eliminates hundreds of round-trips for imports with many distinct categories.

---

## [2.7.0] — 2026-06-02

Dynamic theme color propagation, hero background and text color controls, and logo display improvements.

---

### New Features

#### Primary Theme Color — Full Frontend Propagation
- Created `ThemeColorInjector` component (`src/components/template/ThemeColorInjector.tsx`) mounted inside `PublicLayout`.
- Reads `themeColor` (hex) from public settings, converts it to HSL format, and injects `--primary`, `--primary-foreground`, and `--ring` as CSS custom properties on `document.documentElement`.
- Every Tailwind utility that references `--primary` now automatically reflects the admin's chosen color with no further changes needed: `bg-primary`, `text-primary`, `hover:bg-primary/90`, `border-primary/50`, `bg-primary/10`, `ring-primary`, etc.
- CSS variables are restored to defaults on component unmount (safe for SPA navigation).
- Admin saving a new Primary Color in Site Settings invalidates the public settings cache and updates all colors instantly without a page reload.

#### Hero Background Color Picker (Page Templates → Homepage)
- Added `heroBgColor` field to `HomepageTemplate` interface and `DEFAULT_TEMPLATE_SETTINGS`.
- New **Hero Background Color** picker (color swatch + hex input + "Reset to theme" link) appears in the Settings → Page Templates → Homepage tab, directly below the existing Hero Background Image URL field.
- Hero rendering priority: image URL (`ts.homepage.heroImageUrl` → `p.backgroundImage`) → solid color (`ts.homepage.heroBgColor` → `p.backgroundColor`) → Primary Theme Color fallback.
- Also wired up the previously stored but unused `ts.homepage.heroImageUrl` field to the hero section — the background image URL set in Settings now correctly renders as the hero background.

#### Hero Headline & Subtitle Color Pickers (Homepage Content)
- Added `heroHeadlineColor` and `heroSubtitleColor` fields across the full stack: DB schema (`hero_headline_color`, `hero_subtitle_color` text columns), API PATCH handler, `formatSettings`, and public settings endpoint.
- New color pickers (swatch + hex input + Reset link) appear in Site Settings → Homepage Content, directly below the Hero Headline and Hero Subtitle text fields.
- Colors are applied in `home.tsx` with the priority chain: settings color → builder section color → automatic default (white on image backgrounds, dark on solid).
- Ran `drizzle-kit push` to migrate the two new columns into the live database.

---

### Improvements

#### Header Logo — Wider Display Area
- Logo `<img>` in `PublicLayout` updated from a fixed `h-8` (32 px) to `max-h-[60px] max-w-[170px] w-auto h-auto object-contain`.
- Rectangular and landscape logos now fill the available header space at up to 170 × 60 px while always preserving the original aspect ratio.

---

## [2.6.0] — 2026-05-30

Custom field section assignment and CTA button mode in the Entry Template Editor, plus a featured entries endpoint fix.

---

### New Features

#### Cross-Section Custom Field Assignment (Entry Template Editor)
- Each custom field row in the Entry Template Editor now has a **Section** pill row with three options: **Title**, **Body**, and **Sidebar**.
- Clicking a pill instantly moves that field to the selected section — the field card disappears from its current panel and re-appears in the target section's panel.
- **Title** → field renders in the header area (below the entry title and summary).
- **Body** → field renders in the description column (default behaviour, unchanged).
- **Sidebar** → field appends to the bottom of the Contact & Details sidebar panel.
- Section assignments are stored per-field in `templateSettings.entry.customFieldDisplay[].section` and apply globally to all entry pages on save.
- New fields not yet in the stored settings default to `section: "description"`.
- Edit mode correctly filters each panel to only show fields assigned to that section; drag-to-reorder works within each section independently.

#### CTA Button Mode for Custom Fields (Entry Template Editor)
- Each custom field row now has a third toggle icon: a **green external-link arrow** (ExternalLink), joining the existing eye (label) and image (FileImage) icons.
- Clicking the green icon enables **CTA button mode** for that field:
  - A green-bordered text input drops down below the card: `Button label (default: "Field Name")`
  - The admin types any label — e.g. *"View Profile"*, *"Book Now"*, *"Visit Website"*
  - Leaving the input blank defaults to the field's key name (e.g. "Website")
- In the public view, the field renders as a styled primary-color button: `[ ↗ Button Label ]` — an `<a>` tag with `target="_blank" rel="noopener noreferrer"` pointing to the field's value as the URL.
- Button styling adapts to the section it is in: full-width with larger padding in Body/Header contexts; compact width-full in the Sidebar context.
- **Mutually exclusive with image mode**: enabling CTA button automatically disables the image toggle, and vice versa.
- The button text and mode are stored as `displayAsButton: boolean` and `buttonText?: string` on each `CustomFieldDisplay` entry in `templateSettings`.

---

### Bug Fixes

#### Featured Entries Endpoint
- `GET /api/public/featured` previously returned all published entries instead of only those with `featured = true`.
- Fixed by adding `eq(entries.featured, true)` to the query filter, so only starred entries appear in the Featured section on the homepage.

---

## [2.5.0] — 2026-05-30

Custom field display controls in the Entry Template Editor, image rendering for API-style image URLs, and CSV import mapping override.

---

### New Features

#### Per-Custom-Field Display Controls in Entry Template Editor
- In the "Editing Entry Template" mode (accessed via **Edit Layout** on any entry page), the Description section now renders each custom field as an individually controllable row.
- Each row includes:
  - **Drag handle** — drag up or down to reorder how custom fields appear on all entry pages.
  - **Eye icon** — toggle the field's label/heading on or off (blue = label visible, grey = hidden).
  - **Image icon** (FileImage) — force the field value to be rendered as an `<img>` element instead of plain text (amber = image mode enabled).
- Settings are saved to `templateSettings.entry.customFieldDisplay` via **Save Template** and apply globally to all entry pages.
- New fields not yet in the stored settings default to `showTitle: true, displayAsImage: false` and appear automatically when the template editor is opened.

#### Improved Image URL Auto-Detection
- Custom field values that are image URLs are now automatically rendered as `<img>` tags on entry pages.
- Detection now covers both dot-extension URLs (`.jpg`, `.png`, `.svg`, etc.) **and** API path-segment URLs such as `https://api.dicebear.com/7.x/bottts/svg?seed=…` where the format appears as a path segment without a leading dot.
- Keyword detection also matches hostnames/paths containing `avatar`, `photo`, `image`, `img`, `picture`, `thumbnail`, `icon`, or `logo`.
- The explicit **Image** toggle in the Entry Template Editor overrides auto-detection, allowing any field to be forced into image mode.
- Images hide gracefully via `onError` if the URL fails to load.

#### CSV Import — Override "Skip" Mappings
- When Gemini (or the heuristic analyzer) maps a CSV column to **Skip (don't import)**, admins can now toggle it ON manually.
- Toggling a skipped row ON automatically assigns it to a new `custom_<field_slug>` target (e.g. `avatar_url` → `custom_avatar_url`) and adds it to the available fields list with an amber **Custom Section** badge.
- The dropdown immediately becomes editable so the admin can rename or remap the field before importing.

---

## [2.4.0] — 2026-05-05

Inline Homepage Template Editor for admins.

---

### New Features

#### Inline Homepage Template Editor (Admin Only)
- An **Edit Layout** button now appears in a dark admin bar at the top of the homepage for admin users (hidden from public visitors).
- Clicking it enters **edit mode** — a full-screen split layout with:
  - **Left "Add Section" panel** — lists all available block types (Hero Banner, Category Grid, Featured Entries, Recent Entries, Text Block, Image Block). Singleton blocks (hero, categories, featured, recent) show an "Added" badge when already present. Text Block and Image Block show "+" buttons and can be added multiple times.
  - **Right content area** — shows all current homepage sections in a sortable vertical list using `@dnd-kit`, each wrapped in a blue "Drag to move" overlay with grip handle, eye-toggle, pencil (edit), and trash (delete) controls.
  - **Control bar** — sticky at top with "Template edit mode" badge, Cancel, and Save Template buttons.
- **Pencil icon** on each section opens an inline dialog for editing the section's heading; Text Blocks also expose a body text textarea; Image Blocks expose image URL and caption fields.
- **Eye icon** hides/shows a section without removing it (same as entry editor).
- **Trash icon** removes a custom section (Text Block or Image Block only; singleton sections cannot be deleted).
- **Drag to reorder** — drag any section up or down to change its position on the homepage.
- **Save Template** — persists the updated `homepage.sections` array to `templateSettings` via `PATCH /api/settings`, invalidates public settings cache, and returns to the normal homepage view. Changes apply globally to all visitors immediately.
- Consistent visual design with the entry template editor (blue dashed section borders, same blue handle bar, same ghost overlay on drag).

---

## [2.3.0] — 2026-05-05

AI-powered Homepage Enhancement, and inline Entry Template Editor for admins.

---

### New Features

#### "Enhance With AI" in Homepage Builder
- A new **Enhance With AI** button (purple, sparkle icon) appears in the Homepage Builder top bar.
- Clicking it sends the current sections and site title to Gemini, which returns a fully redesigned layout including a bold hero, intro text section, enriched headings for categories/featured/recent, and a CTA section at the bottom.
- While the AI processes, the button shows "Enhancing…" with a spinner.
- On success, a toast confirms the enhancement and the canvas updates immediately with the new sections.
- A **Restore Defaults** button appears after enhancement; one click reverts to the four default homepage sections.
- Both buttons are homepage-only (not shown on Browse or Entry builders).

#### Inline Entry Template Editor (Admin Only)
- An **Edit Layout** button (blue outlined, pencil icon) now appears on every entry detail page for admin users, positioned top-right next to the "Back to Directory" link.
- Clicking it enters **edit mode**, replacing the normal view with a drag-and-drop template canvas:
  - A blue sticky top bar displays "Editing Entry Template" with **Save Template** and **Cancel** buttons.
  - Each entry section (Title & Summary, Description, Additional Information, Details Sidebar, Related Entries) is rendered as a draggable card using `@dnd-kit`.
  - Each card has a blue "Drag to move" header bar with a grip handle, section label, and eye-toggle button.
  - Toggling a section's eye icon collapses its content and shows "This section is hidden" — toggling again restores it.
  - Sections can be dragged to any position in the vertical stack.
- **Save Template** persists the new section order and visibility globally (applied to all entry pages).
- **Cancel** exits without saving.
- The edit button is not rendered for non-admin users.

---

## [2.2.0] — 2026-05-02

Mobile admin navigation, public nav session awareness, and admin Dashboard shortcut.

---

### New Features

#### Mobile Admin Navigation (Hamburger Menu)
- On screens narrower than `md` breakpoint, the desktop sidebar in `AdminLayout` is hidden and replaced with a sticky top bar showing the site title and a hamburger (☰) icon on the right.
- Tapping the hamburger slides in a full-height drawer from the left edge (width 272 px, `z-50`) with all nav links: Dashboard, Entries, Categories, Import CSV, SEO, Users, Settings, View Site, and Log out.
- A semi-transparent dark overlay (`bg-black/50`, `z-40`) sits behind the drawer; tapping it closes the drawer.
- An X button inside the drawer header provides an explicit close action.
- Tapping any nav link closes the drawer automatically via an `onNavigate` callback.
- Drawer open/close is animated with a CSS `transition-transform duration-300 ease-in-out` (`translateX`). Desktop sidebar layout is unchanged.

#### Public Nav Session Awareness (Sign In / Sign Out)
- The public header now reads the auth token from `useAuth` to determine login state.
- When **not logged in**: "Sign In" link navigates to `/admin/login` (existing behaviour).
- When **logged in**: "Sign In" is replaced with a "Sign Out" button that calls `POST /api/auth/logout`, then clears the local token via `clearToken()`.
- Both the desktop nav bar and the mobile hamburger menu reflect this state.

#### Admin Dashboard Shortcut in Public Nav
- When the logged-in user has `role === "admin"`, a **Dashboard** link (with `LayoutDashboard` icon) appears in the public nav between "Browse All" and "Sign Out".
- Non-admin roles (editor, viewer) do not see this link.
- The link appears in both desktop nav and mobile menu.
- Implemented by calling `useGetCurrentUser` with `{ query: { enabled: isLoggedIn } }` so the API call is skipped entirely when no session token is present.

---

### Developer Notes for v2.2

- **`AdminLayout` mobile drawer**: State is managed with `useState(false)` inside the component — no global state or context required. The `NavLinks` sub-component accepts an optional `onNavigate` prop so the same JSX is shared between desktop sidebar and mobile drawer.
- **`PublicLayout` auth state**: `isLoggedIn = Boolean(token)` from `useAuth`. Role check: `isAdmin = isLoggedIn && currentUser?.role === "admin"`. Both are derived values, not stored in state. The `useGetCurrentUser` query is conditionally disabled when `isLoggedIn` is false to prevent unnecessary 401 requests.
- **Sign Out from public nav**: Calls `logoutMutation.mutateAsync(undefined)` first (invalidates the server session), then `clearToken()` regardless of whether the mutation succeeds, so the UI never gets stuck in a signed-in state if the server is unreachable.
- **Dashboard link visibility**: Intentionally restricted to `admin` role. Editors and viewers can still reach `/admin` directly — the link just isn't surfaced on the public site for them.

---

## [2.1.0] — 2026-05-02

Featured entries, AI-assisted column mapping, and custom field rendering.

---

### New Features

#### Featured Entries
- Added `featured` boolean column to the `entries` table (default `false`).
- `PATCH /api/entries/:id/featured` — toggles featured status, protected by `requireEditor`.
- `GET /public/featured` — public endpoint already existed; now backed by real DB data from the `featured` flag.
- Star icon button in the admin entries table: filled gold star = featured, outline = not featured. Button color uses the site's primary theme color.
- Virtual **"Featured"** row on the Categories screen shows a live count of currently featured entries. Not a real category — for visual reference only.

#### "Map With Gemini" AI Column Mapping
- New **"Map With Gemini"** button on the Map Your Columns import step (Step 2).
- Calls `POST /api/import/ai-map` with the CSV headers and up to 3 sample rows per column.
- Gemini (`gemini-3-flash-preview`) reads column names + sample data and returns one mapping per column: either a standard field name (e.g. `title`, `location`, `contactPhone`) or the literal string `"custom"` for domain-specific columns it cannot match to a standard field.
- Server-side post-processing converts `"custom"` → `custom_<slugify(csvColumnName)>` and sets `customLabel = original CSV column name` — Gemini never invents arbitrary slugs.
- Guarantees exactly one `category` mapping is assigned; falls back to the first non-title, non-skip column if Gemini omits it.
- AI-mapped rows are highlighted in amber with a sparkle (✦) icon. Each row shows an inline description of what the field stores.
- `customFieldDefs` array is returned alongside `mappings` and registered as selectable options in the field dropdown for subsequent manual adjustments.

#### Custom Fields on Entry Detail Page
- `entry.tsx` now renders every key in `customFields` JSONB as its own visible section below the main description.
- Section heading is derived from the custom field key: hyphens and underscores are replaced with spaces, then title-cased (e.g. `accepted-dental-insurance-providers` → "Accepted Dental Insurance Providers").
- Content is rendered `whitespace-pre-wrap` to preserve multi-line values.
- Sections are only shown when the field has a non-empty value.

---

### Developer Notes for v2.1

- **`custom_*` key convention**: Custom field keys in the `customFields` JSONB column always follow the pattern `custom_<slug>` at the mapping stage, then are stored without the `custom_` prefix (e.g. key `accepted-dental-insurance-providers`). The slugifier uses hyphens (`-`), not underscores — the entry detail page now handles both with `/[-_]/g` replacement.
- **Gemini prompt contract**: The AI map prompt explicitly forbids Gemini from inventing slugs. The only valid values for `targetField` are a standard field string (from `AVAILABLE_FIELDS`), `"custom"`, or `"skip"`. All slug generation is done deterministically server-side using `slugify(csvColumn)`.
- **`customLabel` field**: Returned in each mapping object. For custom fields it holds the exact original CSV column header string. For standard and skipped fields it is `null`. The frontend uses this value as the display label in the amber custom-field rows.
- **`PATCH /api/entries/:id/featured`**: Accepts `{ featured: boolean }` body. Returns the updated entry. Guarded by `requireEditor`.
- **Featured count on Categories page**: The "Featured" virtual row is computed client-side from `entries` data already loaded on the page — no extra API call.

---

## [2.0.0] — 2026-05-01

Visual Page Builder release. Introduces a full Elementor-like drag-and-drop builder for all three public pages, WYSIWYG rich text editing, per-section typography and color controls, and end-to-end live preview — builder changes are reflected on public pages immediately after save.

---

### New Features

#### Visual Page Builder (`/admin/builder/:page`)
- Full-screen 3-column layout: block library (left), drag-and-drop canvas (center), properties panel (right)
- Supports three pages: `homepage`, `browse`, `entry` — launched from Settings → Visual Page Builder
- Drag-and-drop section reordering via `@dnd-kit/sortable` (8px pointer activation threshold)
- Per-section enable/disable toggle (eye icon) and delete (trash icon)
- **Gear / Edit button** on every section card — always visible, turns blue when that section is selected — makes it immediately clear which section is being edited
- Auto-save: 1.5-second debounce after any change; shows "Auto-saving…" → "Saved & live" status in the top bar
- Manual "Save Now" button for immediate persistence
- "Preview" button opens the live public page in a new tab

#### Block Types
| Block | Page | Description |
|---|---|---|
| Hero Banner | Homepage | Full-width hero with optional background image, overlay, CTA button |
| Category Grid | Homepage | Clickable category cards; configurable column count and max items |
| Featured Entries | Homepage | Grid of featured/pinned entries |
| Recent Entries | Homepage | Most recently added entries |
| Text Block | Homepage | Custom heading + WYSIWYG body text paragraph |
| Image Block | Homepage | Full-width image with optional caption |
| Page Header | Browse | Title and result count |
| Search & Filters | Browse | Sidebar search and category filter panel |
| Entry Cards Grid | Browse | Main paginated grid |
| Title & Summary | Entry | Entry title, category badge, and summary |
| Description | Entry | Full description body |
| Additional Info | Entry | Extended details section |
| Details Sidebar | Entry | Contact info and metadata side panel |
| Related Entries | Entry | Grid of similar entries in the same category |

#### Per-Section Properties Panel
Every section exposes the following controls (where applicable):

**Typography**
- Font Family — Inter, Poppins, Roboto, Georgia, Playfair Display, Montserrat (per section override)
- Heading Size — S (18px) / M (24px) / L (30px) / XL (36px) / 2XL (48px)
- Heading Color — color swatch + hex input
- Body / Subtitle Size — S (14px) / M (16px) / L (18px) / XL (20px)

**Background**
- Background Color — color swatch + hex input with clear (×)
- Background Image URL — text input; enables overlay slider
- Overlay Opacity — 0–100 slider (shown only when background image is set)

**Text / CTA**
- Text Color, Text Alignment (Left / Center / Right)
- Padding — Small / Medium / Large
- Button Text, Button URL, Button Color

**WYSIWYG Editor** (Text Block only)
- Tiptap-based inline editor with formatting toolbar
- Bold, Italic, Underline; H2, H3, Paragraph; Bullet list, Numbered list
- Alignment: Left / Center / Right
- Text color picker (Tiptap Color extension)
- Output stored as HTML in `richBodyText` prop field

#### `templateSettings` Schema (`SectionConfig`)
Stored as JSONB in `directory_settings.template_settings`. Structure:

```typescript
interface TemplateSettings {
  homepage: { font: string; heroImageUrl: string; sections: SectionConfig[] };
  browse:   { font: string; heroImageUrl: string; cardFields: string[]; sections: SectionConfig[] };
  entry:    { font: string; sidebarFields: string[]; sections: SectionConfig[] };
}

interface SectionConfig {
  id: string;           // unique block id (e.g. "hero", "custom-text-<timestamp>")
  type?: string;        // block type (falls back to id if absent)
  label: string;
  enabled: boolean;
  heading?: string;
  props?: SectionProps;
}

interface SectionProps {
  backgroundColor?: string; backgroundImage?: string;
  textColor?: string; headingColor?: string;
  textAlignment?: "left" | "center" | "right";
  padding?: "sm" | "md" | "lg"; overlayOpacity?: number;
  buttonText?: string; buttonUrl?: string; buttonColor?: string;
  fontFamily?: string; headingFontSize?: string; bodyFontSize?: string;
  bodyText?: string; richBodyText?: string;   // richBodyText is HTML from Tiptap
  imageUrl?: string; imageCaption?: string;
  maxItems?: number; columns?: number;
  sidebarTitle?: string;
}
```

#### Public Page Rendering (WYSIWYG → Live)
`home.tsx`, `browse.tsx`, and `entry.tsx` were fully rewritten to consume `SectionConfig.props` directly:

- **`home.tsx`**: Section order and visibility driven by `templateSettings.homepage.sections`. Each section type (`hero`, `categories`, `featured`, `recent`, `custom-text`, `custom-image`) reads all props (background, colors, fonts, sizes, buttons) and applies them as inline styles. Custom text blocks render `richBodyText` via `dangerouslySetInnerHTML`.
- **`browse.tsx`**: Header banner background/color/heading driven by `header` section props; `heroImageUrl` flat field removed.
- **`entry.tsx`**: Header background color, heading color/size, body font/size, and sidebar background/heading color all driven by their respective section props. Sidebar title reads from `props.sidebarTitle`.

**Auto-save pipeline:**
1. User edits any property in the builder
2. `updateBlocks()` → `scheduleAutoSave()` — 1.5s debounce starts
3. `PATCH /api/settings` with full `templateSettings` object
4. `qc.invalidateQueries(getGetPublicSettingsQueryKey())` fires
5. Public pages re-fetch and re-render with new styles — no page reload needed

---

### Developer Notes for v2.0

- **`templateSettings` not in OpenAPI spec**: The `PATCH /api/settings` body accepts `templateSettings` as a passthrough field in `settings.ts`. The frontend casts `{ templateSettings: current } as any` when calling `updateMutation.mutateAsync`. If you add `templateSettings` to the OpenAPI spec, remove the `as any` cast and regenerate with `pnpm --filter @workspace/api-spec run codegen`.
- **Tiptap imports**: `TextStyle` must be imported as a named export — `import { TextStyle } from "@tiptap/extension-text-style"`. There is no default export. `setContent()` no longer accepts a boolean second argument in newer Tiptap — pass no second argument or use `{ emitUpdate: false }`.
- **Builder route**: `/admin/builder/:page` is wrapped in `RequireAuth` only (no `AdminLayout`). It is full-screen and manages its own header bar.
- **`mergeTemplateSettings`**: Always use this function when reading `templateSettings` from the API — it fills in missing sections and fields with defaults so the public pages never crash on partial data. New default sections are appended to the end of any stored array.
- **Custom block IDs**: Non-unique block types (Text Block, Image Block) use `${type}-${Date.now()}` as their ID so multiple instances can coexist. Standard blocks (hero, categories, etc.) use their type string as the ID and enforce single-instance by skipping the add if the ID already exists.
- **Font loading**: The `FontLoader` component injects a `<link>` tag into `<head>` for Google Fonts at the page level. Individual section font overrides use inline `fontFamily` style — no additional font loading at section level. If you add new fonts, update `FONTS` in `templateTypes.ts` and ensure `getFontGoogleUrl` returns the correct URL.
- **Vite cache**: If Tiptap or other new dependencies produce "does not provide an export named 'default'" errors after install, delete `artifacts/directory-master/node_modules/.vite` and restart the workflow to force re-optimization.

---

## [1.0.0] — 2026-04-30

Initial public release. Full-stack, self-hosted white-label directory website builder.

---

### Architecture

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 (strict) |
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Express 5 + Drizzle ORM |
| Database | PostgreSQL |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| Build | esbuild (ESM bundle) |
| AI | Gemini AI via Replit AI Integrations |

---

### Features

#### Setup Wizard
- Multi-step first-run wizard at `/setup`
- Collects site title, admin email/password, and optional branding
- Sets `installed = true` in `directory_settings` on completion
- All routes redirect to `/setup` until installation is complete

#### Authentication & Authorization
- Session-based auth: Bearer tokens stored in `localStorage`, validated against the `sessions` DB table
- Sessions have a 30-day expiry with DB-backed persistence (survives server restarts)
- Three roles: `admin`, `editor`, `viewer`
  - `admin` — full access including destructive operations
  - `editor` — create/update/delete entries and categories; run imports
  - `viewer` — read-only admin access
- Passwords hashed with `crypto.scryptSync` (salt:hash format)
- Middleware: `requireAuth`, `requireEditor`, `requireAdmin`

#### Public Directory
- Homepage (`/`) — configurable hero, featured entries, category grid, recent listings
- Browse page (`/browse`, `/browse/:category`) — filterable, searchable, paginated listing (Zillow-style cards)
- Entry detail page (`/entry/:id`) — full entry with sidebar showing contact, location, venue, dates, tags
- Sort options: newest (default), oldest, A–Z, Z–A
- All public routes read only `published = true` entries

#### Admin Dashboard
| Page | Path | Notes |
|---|---|---|
| Dashboard | `/admin` | Stats: total entries, categories, published count, drafts |
| Entries | `/admin/entries` | Paginated table with search, status filter, inline publish toggle, edit/delete per row, **Clear All** action |
| Categories | `/admin/categories` | Create, rename, delete categories |
| Import | `/admin/import` | 3-step CSV import wizard (see below) |
| Settings | `/admin/settings` | Site title, logo, hero text, theme colour, custom callout JSON |
| Users | `/admin/users` | Invite users, assign roles, deactivate accounts |

#### CSV Import Wizard (3-step)
Located at `/admin/import`.

**Step 1 — Upload**
- Drag-and-drop or click-to-browse file upload; also supports paste-CSV textarea
- Detects row count from the first parsed line

**Step 2 — Map Columns**
- Calls `POST /api/import/analyze` with CSV headers + up to 3 sample rows
- Server returns heuristic suggestions (regex-based pattern matching, no AI needed at this stage)
- Admin sees a table with: Import toggle (enable/skip), column name, sample values, field dropdown, confidence dot
- Confidence dots: green ≥ 0.85, yellow ≥ 0.60, gray < 0.60
- Location sub-fields (`location_city`, `location_state`, `location_country`) are automatically combined into the `location` field at import time
- At least one column must map to `title` before proceeding

**Step 3 — Progress**
- Calls `POST /api/import/csv` with full CSV content + confirmed `fieldMappings[]`
- Background job: direct field-to-field mapping from confirmed mappings
- Gemini AI enrichment runs **only** when `summary` or `tags` are not mapped — generates them in batches of 20 rows (`gemini-3-flash-preview`, `maxOutputTokens: 16384`)
- Creates missing categories automatically (slug-ified from category name)
- Real-time progress polling via `GET /api/import/status/:jobId` (2-second interval)
- Shows spinner → progress bar → success/error state

#### Entry Fields
All entries support the following fields:

| Field | DB Column | Notes |
|---|---|---|
| Title | `title` | Required |
| Category | `category` | Free-text; auto-creates category on import |
| Summary | `summary` | 1-2 sentence teaser; AI-generated if not mapped |
| Description | `description` | Full rich text |
| Contact Email | `contact_email` | |
| Contact Phone | `contact_phone` | |
| Website | `website` | |
| Location | `location` | Combined from city/state/country sub-fields on import |
| Venue | `venue` | Added in v1.0 for event-style directories |
| Event Type | `event_type` | Conference, Expo, Summit, etc. |
| Start Date | `start_date` | Free-text (e.g. `2026-03-15`) |
| End Date | `end_date` | Free-text |
| Tags | `tags` | Comma-separated; AI-generated if not mapped |
| More Details | `more_details` | Additional plain text |
| Custom Fields | `custom_fields` | JSONB — stores unmapped/overflow columns |
| Published | `published` | Boolean; togglable from entries table |

#### Clear All Entries
- "Clear All" button on `/admin/entries` (red-outlined, admin-only)
- Opens a confirmation modal that requires typing `DELETE` before the action button activates
- Deletes all entries **and** all categories in a single transaction
- Protected by `requireAdmin` middleware on `DELETE /api/entries`
- Success toast shows the exact count of removed entries

---

### API Reference

All routes are under `/api`. Authentication uses `Authorization: Bearer <token>` header.

#### Setup
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/setup/status` | Public | Returns `{ installed: boolean }` |
| `POST` | `/setup/complete` | Public | Complete first-run setup |

#### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Returns session token |
| `POST` | `/auth/logout` | Any | Invalidates session |
| `GET` | `/auth/me` | Any | Returns current user |

#### Entries
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/entries` | Auth | List with pagination, search, category, published filter |
| `POST` | `/entries` | Editor | Create entry |
| `GET` | `/entries/:id` | Auth | Get single entry |
| `PATCH` | `/entries/:id` | Editor | Update entry |
| `DELETE` | `/entries/:id` | Editor | Delete single entry |
| `PATCH` | `/entries/:id/publish` | Editor | Toggle published flag |
| `DELETE` | `/entries` | **Admin** | Wipe all entries and categories |

#### Import
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/import/analyze` | Editor | Analyze headers → suggested `fieldMappings[]` + `availableFields[]` |
| `POST` | `/import/csv` | Editor | Start background import job with confirmed `fieldMappings[]` |
| `GET` | `/import/status/:jobId` | Editor | Poll job status |

#### Public (no auth)
| Method | Path | Description |
|---|---|---|
| `GET` | `/public/entries` | Paginated public listing (published only) |
| `GET` | `/public/entries/:id` | Single public entry |
| `GET` | `/public/stats` | Category + entry counts |
| `GET` | `/public/featured` | Featured entries |
| `GET` | `/public/recent` | Recently added entries |
| `GET` | `/public/settings` | Public-safe site settings |

---

### Database Schema

```
directory_settings   id, site_title, logo_url, hero_title, hero_subtitle,
                     primary_color, installed, custom_callouts (jsonb),
                     created_at, updated_at

users                id, email, password_hash, role, name,
                     created_at, updated_at

sessions             id, user_id (→ users), token, expires_at,
                     created_at

categories           id, name, slug, description,
                     created_at, updated_at

entries              id, title, category, summary, description,
                     contact_email, contact_phone, website, location,
                     venue, event_type, start_date, end_date,
                     tags, more_details, custom_fields (jsonb),
                     source_csv_row, published,
                     created_at, updated_at

import_jobs          id, job_id (uuid), status, message, progress,
                     total_rows, processed_rows, entries_created,
                     categories_created, error,
                     created_at, updated_at
```

---

### Known Limitations & Notes for Developers

- **Gemini model**: `gemini-3-flash-preview`. Batch size for enrichment is 20 rows with `maxOutputTokens: 16384`. Do not increase batch size without also increasing the token limit.
- **API client null guard**: The Orval-generated `getListEntriesUrl` converts `null` parameters to the string `"null"`. Always pass `undefined` (not `null`) for unset optional params in React Query hooks. Server-side null guards exist on `search` and `category` params.
- **express.json limit**: Set to 50 MB in `app.ts` to handle large CSV pastes.
- **Codegen**: Run `pnpm --filter @workspace/api-spec run codegen` after any change to `lib/api-spec/openapi.yaml`. Pre-existing typecheck warnings in the codegen step are non-blocking. Do NOT add `export * from "./generated/types"` to `lib/api-zod/src/index.ts` — causes duplicate export errors.
- **DB migrations**: Use `pnpm --filter @workspace/db run push` for schema changes in development. Never change primary key column types.
- **Sessions**: Stored in the `sessions` table (not in-memory). 30-day expiry. Token is in `localStorage` under the key `"token"`.
- **Clear All requires admin**: The `DELETE /api/entries` route is guarded by `requireAdmin`, not just `requireEditor`. Editors cannot clear all entries.
- **Import field mapping**: `location_city`, `location_state`, `location_country` are virtual fields — they exist only in the mapping UI and are combined server-side into `location` before DB insert. They are not columns in the `entries` table.
