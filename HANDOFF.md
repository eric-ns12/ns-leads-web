# Handoff — NS Leads, big-box scrape session

## Read order on session start
1. `NEXT-ACTIONS.md` — current state, rules, env
2. This file — operational instructions
3. `api/leads.js` — main endpoint pattern
4. `creatine.html` — UI pattern to extend

## Context
Live web app at https://ns-leads.vercel.app fetches brands from Airtable (`appabLn8sA9YObZ20` / Brands `tblfNOtY2VthbPanL`).

**68 brands** in the base have creatine (Shopify-detected in prior session). Your job: detect which are stocked in physical big-box retailers, write back to Airtable.

## Source list
```bash
curl -s 'https://ns-leads.vercel.app/api/leads?creatine=yes' | jq '.leads[] | {brand: ."Brand Name", site: .Website, id}'
```
~68 records. Work queue.

## Method (Eric-confirmed)
Per brand, scrape Google search w/ AI Overview:

```javascript
const query = encodeURIComponent(`are ${brandName} supplements in big box stores`);
const url = `https://www.google.com/search?q=${query}`;
const result = await firecrawl_scrape({ url, formats: ['markdown'] });
```

Parse AI Overview block. Extract retailer names.

### Filter rules (HARD)
- **EXCLUDE** Walmart, Amazon (online-only)
- **INCLUDE** in-store only: Target, Walgreens, CVS, GNC, Vitamin Shoppe, Costco, Sam's Club, Sprouts, Whole Foods, Kroger, Publix, Wegmans, BJ's, Rite Aid, Trader Joe's, HEB, Meijer
- AI Overview mentions ONLY Walmart/Amazon → `Not Found`
- No AI Overview block → `Unknown` / retry
- Page won't load / blocked → **`Unreachable`** (NOT `Unknown`)

## Write-back
Use Airtable MCP tools (`mcp__2d9da5ad-4b9c-47f3-bd70-bdf32fb3ea48__*`). OAuth-based, works for data ops.

Need two new fields on Brands table:
1. `Big Box Status` (singleSelect): `In Big Box`, `Not Found`, `Unreachable`, `Pending`
2. `Found in Retailers` (multilineText) — comma-separated in-store retailers

Field creation needs `schema.bases:write` PAT scope OR manual UI creation. Try MCP `update_field`/`create_field` first; if fails, ask Eric to add fields via UI.

## Budget
- Firecrawl: 1000 credits available · ~68 needed (1 per brand) · safe margin
- Wall time: ~30–60min

## Rules from Eric (preserve all)
- **Never claim "done" / "live" without Chrome visual verification** of deployed URL
- **Never fake results** — if Chrome isn't launched, say so
- **Unreachable** (not Unknown) for sites that fail to load
- **Caveman mode** active (terse, no filler, technical terms exact)
- **Never paste secrets in chat** — use Vercel env vars + server-side endpoints

## PAT scope diagnostic
Hit `https://ns-leads.vercel.app/api/admin-ops`:
- Returns `fieldPatch` / `viewCreate` results (422 if scope missing)
- If both 422: PAT lacks `schema.bases:write` → Eric regen in Airtable Dev Hub, paste in Vercel env, redeploy

## Cleanup when done
- Delete `api/admin-ops.js`
- Delete `api/views.js`
- Update `NEXT-ACTIONS.md`: move big-box scrape to ✅ Done w/ date

## Surface decision (ask Eric)
- Option A: Add `Big Box` column to `/creatine.html` cards (chip per retailer)
- Option B: New `/retail.html` page filtered to shelf-present brands
- Default: A first, B if Eric wants the filter view

## Deploy verification (HARD RULE)
After any push:
1. `until vercel ls ns-leads 2>&1 | head -4 | tail -1 | grep -q "Ready"; do sleep 4; done`
2. `LATEST=$(vercel ls ns-leads 2>&1 | head -4 | tail -1 | awk '{print $4}' | sed 's|https://||')`
3. `vercel alias set "$LATEST" ns-leads.vercel.app`
4. Chrome MCP navigate to https://ns-leads.vercel.app/<page>?bust=<rand> → screenshot → visually confirm change
5. Only THEN write "live" / "verified"

## Airtable field IDs (Brands `tblfNOtY2VthbPanL`)
- `fldFETCuCe9BwWFW4` Brand Name
- `fldqmTOMCp76xNFy1` Website
- `fldP8NkVdkA5F05SM` CEO Name
- `fldxSm1TFnwdImYuJ` CEO Instagram
- `fldS5UGbicNb5YPwx` Pipeline Status
- `fldYfLYo49ZvS2mQy` Brand Status
- `fldTvmjerHUWAZCFE` Brand Type
- `fldg8yX6El4OxL88d` Has Creatine (multipleSelects)
- `fldAcAzSUDvpwYnTH` Include (checkbox)
- `fldrlBnNUlEwCBOjt` Creatine (search button)

## Has Creatine option IDs
- `selWfg3SvQ6hIE41H` Powder
- `selmrefyf6lVzM5Nz` Gummies
- `selRDH7QNHdqOpsa8` Chews (deprecated, to be deleted)
- `selGEtbYTX6fnSOUF` No
- `sel7DQxN8ntML2Z6a` Unknown (to be renamed to Unreachable)
- `selvFqAy6mqocLve6` Chewables
- `selIhClMGwCW14WY5` Capsules
