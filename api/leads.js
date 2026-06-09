// Vercel serverless function — GET /api/leads
// Returns records from the Brands table. Paginates the Airtable REST API.
//
// RENAME-PROOF: we request fields by FIELD ID (returnFieldsByFieldId=true) and map
// them back to friendly keys here. Renaming a field in Airtable never breaks this —
// IDs are immutable. (Global rule: Airtable access = field IDs, never names.)
//
// Query params:
//   ?view=<viewId>   override AIRTABLE_VIEW_ID env (per-page view selection)
//   ?creatine=yes    server-side filter for brands with a real creatine format

export const config = { api: { bodyParser: false } };

// friendly key -> immutable field ID (Brands table tblfNOtY2VthbPanL)
const F = {
  'Brand Name': 'fldFETCuCe9BwWFW4',
  'Brand Type': 'fldTvmjerHUWAZCFE',
  'Website': 'fldqmTOMCp76xNFy1',
  'Contact Name': 'fldP8NkVdkA5F05SM',
  'Contact Email': 'fldv6J00KJNCHArV3',
  'CEO Personal Email': 'fld6LWfbRaXzy2eUW',
  'CEO Work Email': 'fldqIgdCylMZBXmfv',
  'CEO Phone': 'fldzzjS5ZKftnnaxj',
  'CEO Instagram': 'fldxSm1TFnwdImYuJ',
  'CEO IG': 'fldvGJEjhdBpRNqee',
  'Management_Email': 'fldJgMnZPwWRNZXk9',
  'Management_Phone': 'fldPE5acalzMes6VL',
  'Pipeline Status': 'fldS5UGbicNb5YPwx',
  'Brand Status': 'fldYfLYo49ZvS2mQy',
  'Lead Status': 'fldU3xEwMk2NQve8f',
  'Stage': 'fldzK8dIzE53jMkpg',
  'Source': 'flddAnWM3JvgCFq8m',
  'Country': 'fldNEIm82p49EHJHk',
  'Brand City': 'flde8ofp3NJvkey3i',
  'Brand State': 'fldOnqZe4iZIkwefj',
  'Search Creatine': 'fldZ6F9J6CzvKTlGz',
  'Has Creatine': 'fldg8yX6El4OxL88d',
  'Big Box Status': 'fldX7DwFlZAFEVM6l',
  'Found in Retailers': 'fldDjS65i3ul0ZAby',
  'Monthly Traffic': 'fldw7JG88BiCa1jga',
  'Est Revenue (Model)': 'fld5aqZLNNT3EMik1',
  'Priority Score': 'fldRjiYgdUHHYvX69',
  'Retail Doors (est)': 'fldLmQuJrpWL3Nc77',
  'Include': 'fldAcAzSUDvpwYnTH',
  'IMN Notes': 'fldnBo5h14FyLK4dx',
  'IG Followers': 'fldXv8D3TKHCPe0O0',
  'CEO IG Followers': 'fld1SudmVDQhiqxih',
  'Admin Notes': 'fldG9l6Gh6pIqqTfT',
};
const ID_TO_NAME = Object.fromEntries(Object.entries(F).map(([n, id]) => [id, n]));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return res.status(500).json({ error: 'Server misconfigured — env vars missing' });
  }

  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const params = new URLSearchParams();
  Object.values(F).forEach((id) => params.append('fields[]', id));
  params.set('returnFieldsByFieldId', 'true');
  params.set('pageSize', '100');

  // Two modes:
  //   ?creatine=yes  → server-side formula filter for brands with a real creatine format.
  //                    NOTE: filterByFormula only supports field *names*, not IDs, so the
  //                    one unavoidable name reference lives here ({Has Creatine}).
  //   else           → ?view= query, then env, then default view (view IDs are immutable).
  if (req.query && req.query.creatine === 'yes') {
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
        // rec.fields is keyed by field ID → remap to friendly names for the UI.
        const out = { id: rec.id };
        for (const [fid, val] of Object.entries(rec.fields || {})) {
          out[ID_TO_NAME[fid] || fid] = val;
        }
        all.push(out);
      }
      offset = data.offset || null;
      pages += 1;
      if (pages > 80) break; // hard cap
    } while (offset);

    return res.status(200).json({ count: all.length, pages, leads: all });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error reaching Airtable' });
  }
}
