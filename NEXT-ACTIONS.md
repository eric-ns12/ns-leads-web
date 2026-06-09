# NS Leads — Next Actions

Live: https://ns-leads.vercel.app
Repo: github.com/we-build-yours/ns-leads-web (auto-deploy via Vercel)
Airtable base: `appabLn8sA9YObZ20` · Brands table `tblfNOtY2VthbPanL`

## ✅ Done (2026-06-09, session 6)
- **Restored IG follower count + per-card Admin Notes** (regressed in the rebuild; data was always in Airtable).
  - **Followers row** reads `CEO IG Followers` (`fld1SudmVDQhiqxih`) — the scraped field — falling back to
    `IG Followers` (`fldXv8D3TKHCPe0O0`). 40/70 creatine brands populated (1st Phorm 189K, Transparent Labs 54K,
    Pink Stork 332K, RYSE 121K…). NOTE: `IG Followers` itself is empty for brands (it holds 529 *influencer*
    rows); brand follower counts live on `CEO IG Followers`.
  - **Admin Notes** (`fldG9l6Gh6pIqqTfT`, editable overwrite) box under the regular notes on every card —
    saves on blur via `api/update.js` (whitelisted). Distinct from append-only IMN Notes.
  - All 3 pages. Verified live in Chrome (counts render, no console errors).
  - **PAT** Vercel env refreshed from MASTER_CONFIG (matched active `…f7aae94d89b`).
- **Sort** changed Priority Score → best-target: `log10(EstRevenue) − log10(followers)` (high rev + low
  followers on top). No-follower-data brands sink to bottom (unknown ≠ low). Top: ONNIT, Naked, NativePath.
- **Tab semantics reworked** (all query `?creatine=yes`, 70 base):
  - **Has Creatine** (`/`, first tab) = all 70 creatine brands, active+inactive (no Include filter).
  - **All Creatine** (`/creatine.html`, last tab) = **active only** (Include=true, ~65); Include checkbox =
    active toggle, unchecking drops from this tab only.
  - **Verified** (`/verified.html`) = its view (52), unchanged; not Include-gated.
  - Unchecking Include removes a lead from All Creatine but it stays on Has Creatine + Verified. Nav counts
    unified to (70)/(52)/(active) on every page.

## ✅ Done (2026-06-02, session 5)
- **Write-back added** (`api/update.js`, field-ID + whitelisted): editable from the web app.
  - **Notes**: each save **prepends** `[YYYY-MM-DD] <text>` to `IMN Notes` (append-only, no overwrite).
    Card shows read-only history log + an "add a note" box. Verified E2E.
  - **Include**: clickable checkbox, saves instantly; unchecking drops the brand from the Include-gated view.
  - Note: Airtable stores empty multilineText as `"\n"` — display + append both `.trim()` to ignore blanks.

## 🔥 Active
- **Incorporate Admin Notes properly like the feedback widget** (per Eric). Current state: per-card Admin
  Notes box saves on blur to `Admin Notes` (`fldG9l6Gh6pIqqTfT`) via `api/update.js` with a Saving/Saved
  indicator — works but is bare. Goal: give it the canonical `feedback-widget` treatment (modal/inline UX,
  reviewer + timestamp audit trail, sticky success copy, Airtable row semantics) instead of a raw overwrite
  textarea. Invoke the `feedback-widget` skill when building. Deferred — not the quick blur-save above.
- **Hand-fill `Retail Doors (est)` for the 36 blank retail brands** (have shelf presence, no public total).
  Known internals to add: Arrae ~4,000. Others: MaryRuth's, Naked, ONNIT, Pink Stork, Kaged, RYSE, etc.

## ✅ Done (2026-06-02, session 4)
- **`Retail Doors (est)`** field (`fldLmQuJrpWL3Nc77`) added. Free WebSearch pass (5 agents) over the 47
  Big-Box brands. 11 had credible published totals: KOS 23k, RSP 15k, Bloom 14.7k, EHP 4k, Gorilla Mind 2.5k,
  Organifi 2k, Gainful 1.8k, REDCON1 1.8k, JiMMYBAR 1.5k(partial), Better Alt 1.1k, Momentous 640.
  22 non-retail (Big Box=No) set to 0. 36 retail brands left blank (no public total → hand-fill).
- Decision: NOT surfaced on web yet, NOT folded into revenue (too sparse). Per-door velocity insight:
  Arrae 4,000 doors ≈ $10M/mo ≈ $2,500/door/mo — revisit doors→revenue once more counts are filled.

## ✅ Done (2026-06-02, session 3)
- **Est Revenue rebuilt** — old `[Total] Est. Monthly Revenue` was just `Amazon + Shopify-est`, and the
  Shopify-est was ~blank for DTC brands → Transparent Labs showed $875K (Amazon only) for a $10-15M brand.
- New field **`Est Revenue (Model)`** (`fld5aqZLNNT3EMik1`, formula):
  `{Monthly Traffic} * 0.03 * 70 + {[Amazon] Monthly Revenue}` = traffic × 3% conv × $70 AOV + Amazon.
  Tune the `0.03` and `70` in the formula. Does NOT include retail or subscription upside.
  → Transparent Labs $3.5M, MaryRuth's $3.6M, Naked $12.3M, Bloom $7.3M.
- Old `[Total] Est. Monthly Revenue` left intact (still used by broader base / 2387 records).
- Priority Score recomputed off the new revenue; web app `Est Rev` now reads `Est Revenue (Model)`.
- Conversion-rate reference: supplements/health DTC ~3-4% (general ecom ~2.5-3%).

## ✅ Done (2026-06-02, session 2)
- **Priority Score** (`fldRjiYgdUHHYvX69`, number 0-100) created + written for all 69.
  Formula: `50%*log(EstRevenue) + 30%*BigBox + 20%*log(Traffic)`. Computed client-friendly,
  written as static numbers. Top: Bloom 99, Naked 99, 1st Phorm 97, Metagenics/Just Ingredients/RYSE/Jocko/Momentous 95.
- **Web traffic** filled for all 69 (`Monthly Traffic` fldw7JG88BiCa1jga): kept the ~40 existing
  (better source), filled ~29 gaps via hypestat (+ a few fresh SimilarWeb).
- Web app: Priority Score badge (header), Est Rev + Traffic rows on all 3 pages; **cards sorted by score desc**.
- Clickable format filter pills + Big Box toggle + broadened search (name/site/CEO/IG/format/retailers).
- IG `[object Object]`/`@DM` display bug fixed (button-field {label,url} → url only).
- Firecrawl: re-scoped to USER with live key `...792b`; stale home-dir `...1c73` removed.

## ⚠️ Traffic-scraping learnings (important)
- **SimilarWeb CAPTCHAs after ~15 stealth hits** (HTTP 405 stub page, ~594 chars). Each stealth scrape = 5 credits;
  a retry loop on the stub BURNED credits fast (1000→140 in one run). DO NOT brute-force SimilarWeb.
- **hypestat.com works: no stealth, 1 credit, no CAPTCHA.** Parse "receives approximately X visitors per day" ×30.
  Rougher than SimilarWeb (Bloom: hypestat ~351K vs real ~1.8M) — use only to fill gaps, prefer existing base values.
- Firecrawl credits remaining ≈110 (key `...792b`, resets ~2026-06-16). Budget carefully.

## ⏸️ Blocked / waiting
- **Delete leftover field `ZZ Scope Test A` (`fldx387IIrusWEZ2M`) in Brands** — created during a
  schema-capability test. Airtable API has **no delete-field endpoint**, so this is UI-only:
  open Brands table → field header `ZZ Scope Test A` → dropdown → Delete field. (Empty, harmless.)

## ✅ Done
- 2026-06-02: **Big-box retailer detection — all 69 creatine brands scraped + written back.**
  - Method: **Firecrawl `/v1/search`** (NOT Google AI Overview scrape — Google reCAPTCHAs Firecrawl's
    IP even with `proxy:stealth`, which silently burns ~5 credits/hit. The prior 1000-credit account
    was likely drained this way.) Search endpoint ≈2 credits/brand, no CAPTCHA, clean retailer signals.
  - Rules applied: physical brick-and-mortar shelf only. **Walmart counts when stores/shelves**, excluded
    when "Walmart.com". **Amazon always excluded** (online). Generic retailer landing pages (e.g. "GNC |
    Vitamins…" homepage, bare "Store Locations: The Vitamin Shoppe") don't count; brand-specific pages do.
  - Result: **47 Yes / 22 No**. Wrote `Big Box Status` (Yes/No) + `Found in Retailers` (text list) per record.
- 2026-06-02: **Big Box chip added to all 3 pages** (`index`/`verified`/`creatine`.html) — green Yes /
  gray No pill + retailer list. `api/leads.js` now returns `Big Box Status` + `Found in Retailers`.
  Verified live in Chrome on all three pages.
- 2026-06-02: Deleted temp endpoints `api/admin-ops.js` + `api/views.js`.
- 2026-06-01: Card-layout UI built (`/index.html` 9 · `/verified.html` 53 · `/creatine.html` 69).
- 2026-06-01: Shopify `/products.json` creatine scrape — 69 brands tagged with format.

## 🧠 Key learnings (don't relearn the hard way)
- **Airtable Web API cannot edit select choices** (rename/add/delete) on an existing field, and cannot
  create views — regardless of PAT scope. Confirmed empirically: name/description PATCH = 200, choices
  PATCH = 422, create-field-with-choices = 200, but **there is no delete-field endpoint** (404).
  → All select-option edits + view creation are **Airtable UI only** (or Scripting extension).
- `schema.bases:write` on the Vercel PAT **is** active (proven by create-field-with-choices = 200).
- Firecrawl MCP was mis-scoped to project `C:/Users/Office` (not this repo) so its tools never loaded
  here; we called the Firecrawl REST API directly with the key instead.
- **Schema ownership: Eric does Has Creatine cleanup + option edits by hand** (Chews→Chewables, etc.).
  `Big Box Status` stays a simple **Yes/No** singleSelect.

## 🗂️ Files
- `index.html` — Has Creatine view (9, viewId `viwXYjVkt7keSAOKU`) + Big Box chip
- `verified.html` — Verified Brands view (53, viewId `viwAoPiES9KMD3IVG`) + Big Box chip
- `creatine.html` — All Creatine via filterByFormula (69, `?creatine=yes`) + Big Box chip
- `api/leads.js` — main Airtable fetch endpoint (now includes Big Box Status + Found in Retailers)
- `HANDOFF.md` — operational handoff for new session (big-box method now superseded by /v1/search)

## 🔑 Field IDs (Brands)
- `fldX7DwFlZAFEVM6l` Big Box Status (singleSelect: Yes / No)
- `fldDjS65i3ul0ZAby` Found in Retailers (multilineText)
- `fldg8yX6El4OxL88d` Has Creatine (multipleSelects)

## 🔑 Env vars (in Vercel)
- `AIRTABLE_PAT` (Sensitive — schema.bases:write confirmed active)
- `AIRTABLE_BASE_ID` = `appabLn8sA9YObZ20`
- `AIRTABLE_TABLE_NAME` = `Brands`
- `AIRTABLE_VIEW_ID` = `viwAoPiES9KMD3IVG`

## 📋 Rules (from Eric)
- Big-box = **physical shelf presence**. "Walmart.com" / Amazon = online → not counted.
- Standardize creatine format: **Chewables** (not Chews).
- **Never claim "live"/"deployed" without Chrome verification** of the deployed URL.
- **Never fake results.**
