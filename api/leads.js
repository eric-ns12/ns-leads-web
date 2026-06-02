// Vercel serverless function — GET /api/leads
// Returns all records from the configured Airtable leads table.
// Paginates the Airtable REST API until all rows are fetched.
//
// Query params:
//   ?view=<viewId>   override AIRTABLE_VIEW_ID env (per-page view selection)

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return res.status(500).json({ error: 'Server misconfigured — env vars missing' });
  }

  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  // Fields to surface in the UI. Pull a focused set to keep the payload reasonable.
  // Anything not in this list is omitted from the response.
  const fields = [
    'Brand Name',
    'Brand Type',
    'Website',
    'Contact Name',
    'Contact Email',
    'CEO Personal Email',
    'CEO Work Email',
    'CEO Phone',
    'CEO Instagram',
    'CEO IG',
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
    'Search Creatine',
    'Has Creatine',
    'Big Box Status',
    'Found in Retailers',
    'Monthly Traffic',
    'Est Revenue (Model)',
    'Priority Score',
    'Include',
    'IMN Notes',
    '[Total] Est. Monthly Revenue',
    'Total 30 Days',
    'Date Added',
    'Last Modified',
  ];

  const params = new URLSearchParams();
  fields.forEach((f) => params.append('fields[]', f));
  params.set('pageSize', '100');

  // Two modes:
  //   ?creatine=yes  → use a server-side formula filter for brands where Has Creatine
  //                    has any value other than "No" and isn't empty.
  //   else           → use ?view= query, then env, then default view.
  if (req.query && req.query.creatine === 'yes') {
    // FIND returns position (1+) if substring present, else 0. ARRAYJOIN flattens
    // multipleSelects to a comma-separated string of names. Logic:
    //   Has Creatine is NOT empty AND it contains some format other than just "No".
    const formula = `AND({Has Creatine} != BLANK(), OR(FIND("Powder", ARRAYJOIN({Has Creatine})) > 0, FIND("Gummies", ARRAYJOIN({Has Creatine})) > 0, FIND("Chews", ARRAYJOIN({Has Creatine})) > 0, FIND("Chewables", ARRAYJOIN({Has Creatine})) > 0, FIND("Capsules", ARRAYJOIN({Has Creatine})) > 0))`;
    params.set('filterByFormula', formula);
  } else {
    const viewId =
      (req.query && req.query.view) ||
      process.env.AIRTABLE_VIEW_ID ||
      'viwAoPiES9KMD3IVG';
    params.set('view', viewId);
  }

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

      // Hard cap to avoid runaway.
      if (pages > 80) break;
    } while (offset);

    return res.status(200).json({ count: all.length, pages, leads: all });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error reaching Airtable' });
  }
}
