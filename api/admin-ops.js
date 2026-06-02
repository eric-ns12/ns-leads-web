// Temp endpoint — one-shot field + view ops on Brands table.
// DELETE THIS FILE AFTER RUNNING.

export default async function handler(req, res) {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) return res.status(500).json({ error: 'env missing' });

  const TABLE = 'tblfNOtY2VthbPanL';
  const FIELD_HAS_CREATINE = 'fldg8yX6El4OxL88d';
  const out = {};

  // 1. PATCH field: rename Unknown→Unreachable, drop Chews.
  // Per Airtable docs, must include ALL existing choices. Omitted = deleted.
  // IDs preserved on choices we want to keep/rename.
  const newChoices = [
    { id: 'selWfg3SvQ6hIE41H', name: 'Powder',     color: 'yellowLight2' },
    { id: 'selmrefyf6lVzM5Nz', name: 'Gummies',    color: 'greenLight1' },
    { id: 'selGEtbYTX6fnSOUF', name: 'No',         color: 'redBright' },
    { id: 'sel7DQxN8ntML2Z6a', name: 'Unreachable', color: 'grayLight2' }, // renamed
    { id: 'selvFqAy6mqocLve6', name: 'Chewables', color: 'redLight2' },
    { id: 'selIhClMGwCW14WY5', name: 'Capsules',  color: 'greenLight1' },
    // selRDH7QNHdqOpsa8 "Chews" intentionally omitted → dropped
  ];

  try {
    const r1 = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables/${TABLE}/fields/${FIELD_HAS_CREATINE}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options: { choices: newChoices } }),
      }
    );
    const t1 = await r1.text();
    out.fieldPatch = { status: r1.status, body: t1.slice(0, 500) };
  } catch (e) {
    out.fieldPatch = { error: String(e) };
  }

  // 2. Create view "All Creatine Brands (68)"
  // Airtable view-create API does NOT support filter config; user adds filter in UI.
  try {
    const r2 = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables/${TABLE}/views`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'All Creatine Brands (68)',
          type: 'grid',
          visibleFieldIds: [
            'fldFETCuCe9BwWFW4', // Brand Name
            'fldP8NkVdkA5F05SM', // CEO Name
            'fldxSm1TFnwdImYuJ', // CEO Instagram
            'fldqmTOMCp76xNFy1', // Website
            'fldrlBnNUlEwCBOjt', // Creatine (search button)
            'fldg8yX6El4OxL88d', // Has Creatine
            'fldAcAzSUDvpwYnTH', // Include
            'fldS5UGbicNb5YPwx', // Pipeline Status
            'fldYfLYo49ZvS2mQy', // Brand Status
            'fldTvmjerHUWAZCFE', // Brand Type
          ],
        }),
      }
    );
    const t2 = await r2.text();
    out.viewCreate = { status: r2.status, body: t2.slice(0, 600) };
  } catch (e) {
    out.viewCreate = { error: String(e) };
  }

  return res.status(200).json(out);
}
