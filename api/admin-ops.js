// Temp endpoint — one-shot field + view ops on Brands table.
// DELETE THIS FILE AFTER RUNNING.
//
// Airtable Meta API constraints learned:
//   - PATCH field choices: can ADD or RENAME; cannot DELETE. All existing choices
//     must be included with their IDs.
//   - POST view: accepts only { name, type }. visibleFieldIds not supported on create.
//   - Filters cannot be set via API — must be added in UI.

export default async function handler(req, res) {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) return res.status(500).json({ error: 'env missing' });

  const TABLE = 'tblfNOtY2VthbPanL';
  const FIELD_HAS_CREATINE = 'fldg8yX6El4OxL88d';
  const out = {};

  // 1. Rename Unknown → Unreachable. Keep Chews in schema (can't delete via API).
  // Must include ALL existing choices with their IDs.
  const choices = [
    { id: 'selWfg3SvQ6hIE41H', name: 'Powder' },
    { id: 'selmrefyf6lVzM5Nz', name: 'Gummies' },
    { id: 'selRDH7QNHdqOpsa8', name: 'Chews' },         // keep
    { id: 'selGEtbYTX6fnSOUF', name: 'No' },
    { id: 'sel7DQxN8ntML2Z6a', name: 'Unreachable' },   // RENAMED from Unknown
    { id: 'selvFqAy6mqocLve6', name: 'Chewables' },
    { id: 'selIhClMGwCW14WY5', name: 'Capsules' },
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
        body: JSON.stringify({ options: { choices } }),
      }
    );
    out.fieldPatch = { status: r1.status, body: (await r1.text()).slice(0, 500) };
  } catch (e) {
    out.fieldPatch = { error: String(e) };
  }

  // 2. Create empty grid view "All Creatine Brands (68)" — user adds filter in UI.
  try {
    const r2 = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables/${TABLE}/views`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'All Creatine Brands (68)', type: 'grid' }),
      }
    );
    out.viewCreate = { status: r2.status, body: (await r2.text()).slice(0, 600) };
  } catch (e) {
    out.viewCreate = { error: String(e) };
  }

  return res.status(200).json(out);
}
