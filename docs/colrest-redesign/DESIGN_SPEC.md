# colombianrestaurantnear.me — Redesign + Claim/Ascension Spec

**Status:** LOCAL BUILD ONLY — nothing here touches GitHub, the live DB, or the domain until Marcos approves.
**Scope:** colrest instance only (port 3011 / `dirmaster_colrest`). Backend additions are additive to the shared api-server binary and must stay backward-compatible with every other Directory Master instance.
**Written:** 2026-07-17

---

## 1. Design concept — "La Fonda"

Not a Miami guide. Not flag colors (reserved for CHN). The identity is the **Colombian fonda** — the family-run roadside restaurant: clay cazuelas, panela caramel, banana-leaf green, corn-flour cream, roasted coffee. The palette is literally the food. The signature structural motif is the **toldo** — the scalloped storefront awning — which doubles as the listing-status system (see §5).

Scales beyond Miami by design: nothing in the visual language says "Florida" — it says "Colombian kitchen, anywhere."

## 2. Color palette (6 named colors)

| Name | Hex (light ref) | Role |
|---|---|---|
| **Café Tostado** | `#241812` | Ink / dark-mode canvas — roasted coffee, near-black with warmth |
| **Arepa** | `#F8F1E3` | Light-mode canvas / dark-mode text — corn-flour cream |
| **Cazuela** | `#B84A2E` | Primary — burnt clay terracotta (buttons, links, active states) |
| **Panela** | `#CE8A3A` | Warm accent — cane-sugar amber (featured, highlights, stars) |
| **Hoja de Plátano** | `#35604B` | Secondary — deep banana-leaf green (positive sentiment, success, "open now") |
| **Café con Leche** | `#9C7B5F` | Muted — latte tan (secondary text, borders, dividers) |

### Dark-mode adaptation
Dark mode is not an inversion — it's the fonda at night: Café Tostado canvas, Arepa text, Cazuela brightened to `#D65F3F` (contrast on dark), Panela brightened to `#E0A050`, Hoja lifted to `#4E8266`, Café con Leche lifted to `#B59A82`. Surfaces step up in warmth, not gray: card = `#2E211A`, raised = `#3A2A21`.

### Mechanism
CSS custom properties in `src/themes/colrest-fonda.css` (new theme file behind `VITE_THEME=colrest-fonda`, same pattern as CHN themes). Light is default on `:root`; dark applies via BOTH:
- `@media (prefers-color-scheme: dark)` under `:root:not([data-theme="light"])`
- `[data-theme="dark"]` explicit override

The toggle stamps `data-theme` on `<html>`, persisted in `localStorage("colrest.theme")`; absent = follow system. All shadcn tokens (`--background`, `--primary`, etc.) are remapped inside the theme file so every existing component picks the identity up for free.

## 3. Typography

- **Display / headings: Fraunces** (Google Fonts, variable — optical size + "SOFT/WONK" axes). Soft, goopy terminals read as hand-lettered fonda signage and chalkboard menus without being kitsch; at text sizes it's a credible editorial serif. Used for: listing names, section heads, the wordmark, big numerals in rating stamps.
- **UI / body / data: Hanken Grotesk** (Google Fonts, variable). Warm humanist grotesk — not Inter — tall x-height that survives data-dense trust rows, full Spanish diacritics. `font-variant-numeric: tabular-nums` on all rating/review figures so columns align.
- Pairing logic: warm serif voice for the *food and the family name*, neutral warm sans for the *data and chrome*. The trust signals must read like measurement, not decoration — the sans carries them.

## 4. Layout & interaction

### Card grid — "menu board", not cookie-cutter
- 12-col grid. **Featured (premium)** listings span 2 columns with photo, striped toldo band, and full trust strip. Standard listings are compact vertical cards. Unclaimed listings render as **menu line items**: single-row entries with a dotted leader (menu-price dots) running name ⋯⋯ rating — denser, visually quieter, and they make claimed cards visibly *more alive* (the ascension incentive is the design).
- Hover: card lifts 2px, toldo band saturates. No cursor glows/parallax — warmth, not tech-demo.

### Detail view
- Header band in surface color with the toldo scallop as its bottom edge; name in Fraunces display; category + neighborhood chips.
- Two columns: left = description/story, photos (tier-gated count); right = sticky **Reputación panel** + contact card (phone/website buttons, click-tracked as today; phone number rendered from a single `contactPhone` data field so swapping in a tracked DNI number later is purely a data change).

### Trust signals — three platforms as one "Reputación" panel
- Aggregate row: one big Fraunces numeral (weighted avg across platforms), star row in Panela, total review count.
- Per-platform rows: `G` / `Yelp` / `TA` monogram chip + rating + review count, tabular-aligned.
- **Sentiment bar**: single horizontal bar, Hoja green fill = positive %, Cazuela = negative %, neutral gap in Café con Leche. Label: "90% positivo".
- **Owner responsiveness**: reply-delay rendered as a plain-language chip — ≤3d "Responde rápido", ≤14d "Responde", >30d or null: not shown publicly (absence, not shaming). Powered by `ownerReplyDelayDays`.
- On cards: compact version — avg rating + count + sentiment microbar (2px).

## 5. Signature motif — the Toldo (scalloped awning)

One motif, doing structural + status work:
- CSS-only scalloped edge (repeating `radial-gradient` mask, no images) on the hero bottom edge, section dividers, and the top band of every listing card.
- **Status system**: unclaimed = flat Café con Leche awning (faded canvas); claimed = solid Cazuela awning + "Verificado ✓" seal; featured/premium = **striped** Cazuela/Panela awning (the classic fonda stripe). The awning IS the claim-state indicator — legible at grid scale without reading a word.

## 6. Listing states

| State | Visual |
|---|---|
| Unclaimed | Menu-line-item row, muted, grayscale photo (if any), faded toldo, chip: "¿Es tuyo? / Is this yours?" → claim flow |
| Claimed (free+) | Full card, color photo, solid toldo, "Verificado" seal, hours/description owner-editable |
| Featured (premium) | 2-col card, striped toldo, top-of-category sort, cover photo |

## 7. Shell controls — language + theme

Header right cluster, equal weight: `[ES | EN]` segmented pill next to sun/moon theme toggle. Both persisted (`colrest.lang`, `colrest.theme`). Default language from `navigator.language` (`es-*` → ES). i18n = hand-rolled string layer (`src/i18n/en.ts`, `es.ts`, `I18nProvider`, `useT()`) — no heavy library. UI chrome, categories, empty states, claim flow, dashboard, generated copy: both locales. Restaurant names/addresses untouched.

## 8. Backend — claim / owner / tiers (all additive)

### New tables (dedicated — credentials never in customFields)
- `owners`: id, name, email (unique), passwordHash, createdAt
- `owner_sessions`: token, ownerId, expiresAt (mirrors admin `sessions` pattern)
- `claims`: id, entryId, ownerId, businessEmail, phone, message, method (`domain-match` | `manual`), status (`pending`/`approved`/`rejected`), reviewedBy, reviewedAt, createdAt

### entries.customFields additions (read-merge-write ONLY — never wholesale PATCH)
Public-safe: `claimStatus` (`unclaimed`/`pending`/`claimed`), `subscriptionTier` (`free`/`basic`/`pro`/`premium`), `hours`, `ownerDescription`, `photos[]`, `menuUrl`.
Private (stripped from public formatEntry by `_` prefix convention): `_ownerId`, `_claimedAt`.
A server-side `mergeCustomFields(entryId, patch)` helper does SELECT → merge → UPDATE inside the api-server; owner PATCH routes only ever whitelist specific keys.

### Claim flow (ship-safe: manual review first, domain-match assist)
1. Public listing → "Claim this business" → form: name, business email, phone, password, message.
2. Creates `owners` row + `claims` row (`pending`). If email domain === listing website domain → method `domain-match`, surfaced to admin as pre-verified; still admin-approved in v1 (no SMTP dependency to ship).
3. Admin approves in new `/admin/claims` queue → entry customFields merge: `claimStatus: "claimed"`, `subscriptionTier: "free"`, `_ownerId`.
4. Owner logs in at `/owner/login` → dashboard.

### Owner API (`/api/owner/*`, own `requireOwner` middleware — zero contact with admin auth)
- `POST /api/owner/claim` (account + claim), `POST /api/owner/login`, `POST /api/owner/logout`, `GET /api/owner/me`
- `GET /api/owner/listing` — their claimed entry
- `PATCH /api/owner/listing` — whitelisted keys only, tier-caps enforced server-side (photo counts etc.)
- `POST /api/owner/upgrade-request` — creates a `contacts` record tagged with requested tier (real path, no dead buttons; billing later = data change)

### Admin API (additive)
- `GET /api/claims` + `PATCH /api/claims/:id` (approve/reject), `requireAdmin`.

### Tier gating (UI + API, sellable later)
| | Free | Basic | Pro | Premium |
|---|---|---|---|---|
| Hours, description, contact edits | ✓ | ✓ | ✓ | ✓ |
| Photos | 1 | 5 | 15 | 30 |
| Menu link | — | ✓ | ✓ | ✓ |
| Analytics (views/clicks 30d) | — | — | ✓ | ✓ |
| Featured placement + striped toldo | — | — | — | ✓ |

Dashboard shows all tiers with lock badges; locked features route to upgrade-request. Everyone defaults `free` on claim.

## 9. Existing contracts — untouched
`GET/POST/PATCH/DELETE /api/entries`, `/api/public/*`, `/api/settings`, auth, import, SEO routes: unchanged shapes. New code = new routes + new tables + new customFields keys + one public formatEntry filter that strips only `_`-prefixed keys (keys that don't exist in production data today, so current consumers see zero difference).

## 10. Deploy notes (for the go-ahead conversation — not executed now)
- Frontend: build with `VITE_THEME=colrest-fonda` → `static-builds/colrest/public`. Instance-isolated.
- Backend: shared binary — redeploying it restarts all dirmaster instances; new tables must be pushed per-DB (`pnpm run push-force` with colrest DATABASE_URL only). Other instances ignore the new routes/tables entirely.
- Kie.ai hero imagery: deferred; will flag before spending credits. The design stands without generated imagery (CSS motif carries it).
