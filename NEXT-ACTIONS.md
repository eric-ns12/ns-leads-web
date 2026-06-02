# NS Leads — Next Actions

Live: https://ns-leads.vercel.app
Repo: github.com/we-build-yours/ns-leads-web (auto-deploy via Vercel)
Airtable base: `appabLn8sA9YObZ20` · Brands table `tblfNOtY2VthbPanL`

## 🔥 Active

### 1. Big-box retailer detection (68 creatine brands)
- Strategy: `firecrawl_scrape` Google AI Overview page per brand
- Query template: `https://www.google.com/search?q=are+<brand>+supplements+in+big+box+stores`
- Extract AI Overview block; parse retailer mentions
- **Exclude** Walmart + Amazon (online-only, not shelf presence)
- **Include** physical-shelf retailers: Target, Walgreens, CVS, GNC, Vitamin Shoppe, Costco, Sam's Club, Sprouts, Whole Foods, Kroger, Publix, Wegmans
- Write back to Airtable Brands records:
  - `Big Box Status` (singleSelect — needs to exist: `In Big Box`, `Not Found`, `Unreachable`, `Pending`)
  - `Found in Retailers` (multilineText — list of retailers found)
- Budget: ~68 Firecrawl credits (1 per brand) — confirmed 1000 available
- Source list: `curl -s 'https://ns-leads.vercel.app/api/leads?creatine=yes' | jq '.leads[]'`

### 2. Field schema fixes (BLOCKED — likely needs `schema.bases:write` PAT scope)
- Rename `Has Creatine` option `Unknown` → `Unreachable`
- Drop `Has Creatine` option `Chews` (UI-only, no API path)
- Create Airtable view `All Creatine Brands (68)`
- `/api/admin-ops` endpoint built but returns 422 — likely PAT scope issue
- **Fix**: regenerate PAT in Airtable Developer Hub with `schema.bases:write` added, update on Vercel, redeploy

## ⏸️ Blocked / waiting
- PAT scope verification for schema ops

## ✅ Done
- 2026-06-01: Card-layout UI built (`/index.html` 9 brands · `/verified.html` 58 · `/creatine.html` 69)
- 2026-06-01: Pill rendering bug fix (handle both Airtable object + string shapes from view vs filterByFormula)
- 2026-06-01: Shopify `/products.json` creatine scrape — 68 brands tagged with format
- 2026-06-01: Chews → Chewables migration (5 records: MuscleTech, Muscle Feast, Gains in Bulk, Evlution Nutrition, Momentous)
- 2026-06-01: 3 records manually corrected by Eric (one was Adept Care) — should have been "Unreachable" not "No"

## 🤔 Open questions
- Where to surface big-box data on the web app?
  - A: Add `Big Box` column to `/creatine.html` cards (chip per retailer)
  - B: New `/retail.html` page filtered to brands with shelf presence
  - Default: Option A first, then B if Eric wants the filter view

## 📋 Rules (from Eric)
- Shopify site fails to load → **Unreachable** (not Unknown, not No)
- Standardize: **Chewables** (not Chews)
- **Never claim "live" / "deployed" without Chrome verification** of the deployed URL
- **Never fake test results** — say "Chrome isn't launched" if can't verify

## 🗂️ Files
- `index.html` — Has Creatine view (9 brands, viewId `viwXYjVkt7keSAOKU`)
- `verified.html` — Verified Brands view (58 brands, viewId `viwAoPiES9KMD3IVG`)
- `creatine.html` — All Creatine via filterByFormula (69 brands, `?creatine=yes`)
- `api/leads.js` — main Airtable fetch endpoint
- `api/views.js` — temp endpoint (DELETE when done)
- `api/admin-ops.js` — temp endpoint for schema ops (DELETE when done)
- `HANDOFF.md` — operational handoff for new session

## 🔑 Env vars (in Vercel)
- `AIRTABLE_PAT` (Sensitive — masked, only server-readable)
- `AIRTABLE_BASE_ID` = `appabLn8sA9YObZ20`
- `AIRTABLE_TABLE_NAME` = `Brands`
- `AIRTABLE_VIEW_ID` = `viwAoPiES9KMD3IVG`
