// Vercel serverless function — GET /api/leads
// Returns all records from the configured Airtable leads table.
// Paginates the Airtable REST API until all rows are fetched.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return res.status(500).json({ error: 'Server misconfigured — env vars missing' });
  }

  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  // Fields to surface in the UI. Pull a focused set to keep the payload reasonable
  // across 4k+ records. Anything not in this list is omitted from the response.
  const fields = [
    'Brand Name',
    'Website',
    'CEO Name',
    'CEO Email',
    'CEO Personal Email',
    'CEO Work Email',
    'CEO Phone',
    'Management_Email',
    'Management_Phone',
    'Pipeline Status',
    'Brand Status',
    'Lead Status',
    'Stage',
    'Source',
    'Country',
    'Brand City',
    'Brand State',
    '[Total] Est. Monthly Revenue',
    'Total 30 Days',
    'Date Added',
    'Last Modified',
  ];

  const params = new URLSearchParams();
  fields.forEach((f) => params.append('fields[]', f));
  params.set('pageSize', '100');

  const all = [];
  let offset = null;
  let pages = 0;

  try {
    do {
      const url = offset
        ? `${base}?${params.toString()}&offset=${encodeURIComponent(offset)}`
        : `${base}?${params.toString()}`;

      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
      });

      if (!r.ok) {
        const errText = await r.text();
        console.error('Airtable list error:', r.status, errText.slice(0, 400));
        return res.status(502).json({ error: 'Airtable rejected the request', status: r.status });
      }

      const data = await r.json();
      for (const rec of data.records || []) {
        all.push({ id: rec.id, ...rec.fields });
      }
      offset = data.offset || null;
      pages += 1;

      // Hard cap to avoid runaway. 4176 records / 100 page size = ~42 pages.
      if (pages > 80) break;
    } while (offset);

    return res.status(200).json({ count: all.length, pages, leads: all });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error reaching Airtable' });
  }
}
