// Temp endpoint: list Creatine-containing views with their record counts
// + flag whether each view exposes the key fields seen in Eric's reference page.

export default async function handler(req, res) {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'env vars missing' });
  }

  const TABLE = 'tblfNOtY2VthbPanL'; // Brands
  const KEY_FIELDS = {
    creatine_btn: 'fldrlBnNUlEwCBOjt',     // Creatine (button — "Search Creatine Products" link in Eric's page)
    has_creatine: 'fldg8yX6El4OxL88d',     // Has Creatine (multipleSelects — "Powder" pill in Eric's page)
    include: 'fldAcAzSUDvpwYnTH',          // Include (checkbox — green ✓ in Eric's page)
    ceo_ig: 'fldxSm1TFnwdImYuJ',           // CEO Instagram
    pipeline_status: 'fldS5UGbicNb5YPwx',  // "Next Hit List" / "Owe Follow Up" pill candidate
    brand_status: 'fldYfLYo49ZvS2mQy',
    lead_status: 'fldU3xEwMk2NQve8f',
  };

  // 1. Get all views via Meta API
  const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables?include=visibleFieldIds`;
  let meta;
  try {
    const r = await fetch(metaUrl, { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } });
    if (!r.ok) return res.status(502).json({ error: 'meta api error', status: r.status });
    meta = await r.json();
  } catch (e) {
    return res.status(500).json({ error: 'meta fetch failed', message: String(e) });
  }

  const brands = (meta.tables || []).find((t) => t.id === TABLE);
  if (!brands) return res.status(404).json({ error: 'Brands table not found' });

  const creatineViews = (brands.views || []).filter(
    (v) => v.visibleFieldIds && v.visibleFieldIds.includes(KEY_FIELDS.creatine_btn)
  );

  // 2. For each Creatine view, count records via /v0/{base}/{table}?view={id}&fields[]=Brand Name
  async function countView(viewId) {
    let total = 0;
    let offset = null;
    let pages = 0;
    do {
      const u = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE}`);
      u.searchParams.set('view', viewId);
      u.searchParams.set('pageSize', '100');
      u.searchParams.append('fields[]', 'Brand Name');
      if (offset) u.searchParams.set('offset', offset);
      const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } });
      if (!r.ok) return -1;
      const d = await r.json();
      total += (d.records || []).length;
      offset = d.offset || null;
      pages += 1;
      if (pages > 50) break; // safety
    } while (offset);
    return total;
  }

  const results = [];
  for (const v of creatineViews) {
    const visible = new Set(v.visibleFieldIds);
    const flags = {};
    for (const [k, fid] of Object.entries(KEY_FIELDS)) flags[k] = visible.has(fid);
    const count = await countView(v.id);
    results.push({
      id: v.id,
      name: v.name,
      type: v.type,
      recordCount: count,
      visibleFieldCount: v.visibleFieldIds.length,
      hasKeyFields: flags,
    });
  }

  // Sort: most likely match first (record count near 9, has Include checkbox, has Has Creatine)
  results.sort((a, b) => {
    const distA = Math.abs(a.recordCount - 9);
    const distB = Math.abs(b.recordCount - 9);
    return distA - distB;
  });

  return res.status(200).json({
    referenceImage: { brandsShown: 9, observedFields: ['Brand Name', 'CEO', 'CEO IG', 'Website', 'Search', 'Creatine', 'Include', 'Lead Notes', 'Status Pill'] },
    creatineViewCount: results.length,
    views: results,
  });
}
