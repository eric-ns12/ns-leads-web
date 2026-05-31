// Temp endpoint: list all views in the New Leads base + flag which ones
// contain the "Creatine" button field. Used to find the right view to wire up.

export default async function handler(req, res) {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'env vars missing' });
  }

  // Meta API: GET /v0/meta/bases/{baseId}/tables — includes views by default.
  const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables?include=visibleFieldIds`;

  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: 'meta api rejected', status: r.status, body: text.slice(0, 500) });
    }
    const data = await r.json();

    const brands = (data.tables || []).find((t) => t.name === 'Brands' || t.id === 'tblfNOtY2VthbPanL');
    if (!brands) {
      return res.status(404).json({ error: 'Brands table not found' });
    }

    // The "Creatine" button field — searches "/search?q=creatine&type=product" on the brand's site.
    const CREATINE_FIELD_ID = 'fldrlBnNUlEwCBOjt';

    const allViews = (brands.views || []).map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      visibleFieldIds: v.visibleFieldIds || null,
      includesCreatine: v.visibleFieldIds ? v.visibleFieldIds.includes(CREATINE_FIELD_ID) : 'unknown (visibleFieldIds not exposed by API)',
    }));

    const withCreatine = allViews.filter((v) => v.includesCreatine === true);

    return res.status(200).json({
      totalViews: allViews.length,
      viewsWithCreatineField: withCreatine.length,
      withCreatine,
      allViews,
    });
  } catch (err) {
    return res.status(500).json({ error: 'fetch failed', message: String(err) });
  }
}
