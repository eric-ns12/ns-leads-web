# NS Leads Web

Client-rendered viewer for the **New Leads** Airtable base (Brands table).

- `index.html` — vanilla HTML + Tailwind CDN. Renders a sortable, searchable table.
- `api/leads.js` — Vercel serverless function. Reads `AIRTABLE_PAT`, paginates the Airtable REST API, returns JSON.

## Env vars (Vercel project)

- `AIRTABLE_PAT` — Personal access token with `data.records:read` for the base
- `AIRTABLE_BASE_ID` — `appabLn8sA9YObZ20`
- `AIRTABLE_TABLE_NAME` — `Brands`

## Local dev

```bash
vercel dev
```

## Deploy

Push to `main` triggers a Vercel deploy via the GitHub integration.
