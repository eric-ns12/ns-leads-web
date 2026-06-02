# NS Leads — Next Actions

Live: https://ns-leads.vercel.app
Repo: github.com/we-build-yours/ns-leads-web (auto-deploy via Vercel)
Airtable base: `appabLn8sA9YObZ20` · Brands table `tblfNOtY2VthbPanL`

## 🔥 Active
- (none) — big-box pass complete.

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
